import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleUser, faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FormField, form, required, validate, debounce, minLength, maxLength } from '@angular/forms/signals';
import { CommonModule } from '@angular/common';
import { AuthS } from '../../../services/auth/auth-s';
import { LoginS } from '../../../services/auth/login-s';

@Component({
  selector: 'app-login5',
  imports: [FontAwesomeModule, FormField, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthS);
  private LoginService = inject(LoginS);
  private router = inject(Router);
  faCircleUser = faCircleUser;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faXmark = faXmark;
  showPassword = signal<boolean>(false);
  passwordFieldType = 'password';
  isSubmitting = signal<boolean>(false);
  user = signal<any>(null);
  error = signal<string>("");

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
    this.passwordFieldType = this.showPassword() ? 'text' : 'password';
  }

  ngOnInit(): void {
    this.user.set(this.authService.getUser());
  }

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    username: '',
    password: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.username, { message: 'Username is required' });
    required(schemaPath.password, { message: 'Password is required' });
    minLength(schemaPath.password, 6, { message: 'Password must be at least 6 character' })
    maxLength(schemaPath.password, 18, { message: 'Password cannot exceed 18 character' })
    validate(schemaPath.password, ({ value }) => {
      const specialCharRegex = /[!@#$%^&*(),.?":{}/|\<>]/;
      if (!specialCharRegex.test(value())) {
        return {
          kind: 'complexity',
          message: 'Password must contain at least one special character'
        }
      }
      return null
    })
    debounce(schemaPath.username, 500);
    debounce(schemaPath.password, 500);
  });

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form().valid()) {
      this.isSubmitting.set(true);
      this.error.set("");

      // Create the payload with proper types
      const formValue = this.form().value();

      this.LoginService.login(formValue).subscribe({
        next: (response: any) => {
          this.authService.setUser(response);
          this.formReset();
          this.isSubmitting.set(false);
          this.router.navigate(['/admin']);
        },
        error: (error: any) => {
          this.error.set(`${error?.status} : ${error?.statusText} User` || 'An error occurred during login.');
          console.error('Error login user:', error);
          this.isSubmitting.set(false);
        }
      });
    } else {
      this.error.set("Form is Invalid!")
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    // Reset the model
    this.model.set({
      username: '',
      password: '',
    });
    this.form().reset();
  }

  closeError(e: Event) {
    e.preventDefault();
    this.error.set("");
  }

}

