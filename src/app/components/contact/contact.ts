import { Component, inject, signal, OnInit, computed, PLATFORM_ID, Renderer2 } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormField, form, maxLength, minLength, required, validate } from '@angular/forms/signals';
import { ContactS } from '../../services/contact-s';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faPaperPlane, faUser, faTag } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../../environments/environment';
import { ContactFormM } from '../../utils/models';
import { SeoManager } from '../../services/seo-manager';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, FormField],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements OnInit {
  // Font Awesome icons
  faEnvelope = faEnvelope;
  faPaperPlane = faPaperPlane;
  faUser = faUser;
  faTag = faTag;

  // Dependency Injection
  private contactService = inject(ContactS);
  private seoManager = inject(SeoManager);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  // Signal State
  contactInfo = signal<any>(null);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);
  isSuccess = signal<boolean>(false);

  // Computed values for SEO
  seoTitle = computed(() => {
    const info = this.contactInfo();
    return info?.heading || 'Contact Us - Get in Touch';
  });

  seoDescription = computed(() => {
    const info = this.contactInfo();
    if (!info) return 'Get in touch with us for any inquiries or support. We are here to help you with your needs.';
    
    const descriptions = [
      info.description,
      info.description2,
      info.description3,
      info.description4,
      info.description5
    ].filter(Boolean).join(' ');
    
    return descriptions || 'Get in touch with us for any inquiries or support. We are here to help you with your needs.';
  });

  // Form Model
  model = signal({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  // Signal Form Validation
  form = form(this.model, (schemaPath) => {
    // Name validation
    required(schemaPath.name, { message: 'Name is required' });
    maxLength(schemaPath.name, 50, { message: 'Name cannot exceed 50 characters' });
    
    // Email validation
    required(schemaPath.email, { message: 'Email is required' });
    maxLength(schemaPath.email, 100, { message: 'Email cannot exceed 100 characters' });
    validate(schemaPath.email, ({ value }) => {
      if (value() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value())) {
        return {
          kind: 'email',
          message: 'Please enter a valid email address'
        };
      }
      return null;
    });
    
    // Subject validation
    required(schemaPath.subject, { message: 'Subject is required' });
    minLength(schemaPath.subject, 3, { message: 'Subject must be at least 3 characters' });
    maxLength(schemaPath.subject, 100, { message: 'Subject cannot exceed 100 characters' });
    
    // Message validation
    required(schemaPath.message, { message: 'Message is required' });
    maxLength(schemaPath.message, 1000, { message: 'Message cannot exceed 1000 characters' });
    validate(schemaPath.message, ({ value }) => {
      if (value() && value().length < 10) {
        return {
          kind: 'minlength',
          message: 'Message must be at least 10 characters'
        };
      }
      return null;
    });
  });

  // Lifecycle
  ngOnInit(): void {
    this.loadContactInfo();
    isPlatformBrowser(this.platformId) && this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }

  // Load Contact Information
  loadContactInfo(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.contactService.get(environment.companyCode).subscribe({
      next: (data) => {
        this.contactInfo.set(data);
        this.updateSeoTags(); // Update SEO after data is loaded
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading contact info:', error);
        this.hasError.set(true);
        this.isLoading.set(false);
        this.updateSeoTags(); // Still update SEO with fallback values
      }
    });
  }

  // Update SEO Tags
  updateSeoTags(): void {
    this.seoManager.updateSeoData({
      title: this.seoTitle(),
      description: this.seoDescription(),
      type: 'website',
    });
  }

  // Form Submission
  onSubmit(event: Event): void {
    event.preventDefault();

    // Validate form
    if (!this.form().valid()) {
      console.log('Form is invalid:', this.form().errors());
      alert(this.form().errors() || "Form is Invalid!")
      return;
    }

    this.isSubmitted.set(true);
    const formValue = this.form().value();
    const contactInfo = this.contactInfo();

    // Validate contact info exists
    if (!contactInfo?.email) {
      console.error('Contact email not available');
      alert('Unable to send message. Please try again later.');
      this.isSubmitted.set(false);
      return;
    }

    // Prepare email data
    const emailData: ContactFormM = {
      name: formValue.name,
      email: formValue.email, // User's email
      subject: formValue.subject,
      message: formValue.message,
      toEmail: contactInfo.email // Company contact email
    };

    // console.log('Sending contact form:', {
    //   from: emailData.email,
    //   to: emailData.toEmail,
    //   subject: emailData.subject
    // });

    // Send email
    this.contactService.sendContactEmail(emailData).subscribe({
      next: (response) => {
        // console.log('Email sent successfully:', response);
        this.isSuccess.set(true);
        this.isSubmitted.set(false);
        this.formReset();
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          this.isSuccess.set(false);
        }, 5000);
      },
      error: (error) => {
        console.error('Error sending email:', error);
        this.isSubmitted.set(false);
        
        // User-friendly error message
        let errorMessage = 'Failed to send message. Please try again later.';
        
        if (error.status === 0) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.status === 400) {
          errorMessage = 'Invalid form data. Please check your inputs.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        alert(errorMessage);
      }
    });
  }

  // Form Reset
  formReset(): void {
    this.model.set({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
    this.form().reset();
  }

  // Getter for form errors (for template)
  get formErrors() {
    return this.form().errors();
  }
}