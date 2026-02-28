// product-view.ts
import { faWhatsapp, faFacebook, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { Component, inject, PLATFORM_ID, Renderer2, signal, computed, OnInit, OnDestroy} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { environment } from '../../../environments/environment';
import { ProductM } from '../../utils/models';
import { ProductS } from '../../services/product-s';
import { SeoManager } from '../../services/seo-manager';
import { RelatedProducts } from './related-products/related-products';
import { FlowbiteS } from '../../services/flowbite';
import { ProductGallery } from "./product-gallery/product-gallery";

@Component({
  selector: 'app-product-view',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, RouterLink, RelatedProducts, ProductGallery],
  templateUrl: './product-view.html',
  styleUrls: ['./product-view.css']
})
export class ProductView implements OnInit, OnDestroy {
  faFacebook = faFacebook;
  faTwitter = faTwitter;
  faLinkedin = faLinkedin;
  faWhatsapp = faWhatsapp;
  // Services
  private productService = inject(ProductS);
  private seoManager = inject(SeoManager);
  private route = inject(ActivatedRoute);
  private renderer = inject(Renderer2);
  private flowbiteService = inject(FlowbiteS);
  private platformId = inject(PLATFORM_ID);

  // State
  product = signal<ProductM | null>(null);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);
  selectedImageIndex = signal<number>(0);
  quantity = signal<number>(1);
  isAddingToCart = signal<boolean>(false);

  // Subscriptions
  private routeSub?: Subscription;

  // Constants
  readonly ImageApi = environment.ImageApi;
  readonly companyName = environment.companyName;

  // Computed properties
  productImages = computed(() => {
    const product = this.product();
    if (!product) return [];

    const images = [];
    // Add main image first
    if (product.imageUrl) {
      images.push({
        src: `${this.ImageApi}${product.imageUrl}`,
        alt: product.title || 'Product Image',
        thumbnail: `${this.ImageApi}${product.imageUrl}`
      });
    }

    // Add additional images
    if (product.images && product.images.length > 0) {
      product.images.forEach((img, index) => {
        images.push({
          src: `${this.ImageApi}${img}`,
          alt: `${product.title} - Image ${index + 2}`,
          thumbnail: `${this.ImageApi}${img}`
        });
      });
    }

    return images;
  });

  hasCatalog = computed(() => {
    const product = this.product();
    return product?.catalogURL && product.catalogURL.trim() !== '';
  });

  ngOnInit(): void {
    this.scrollToTop();
    this.initializeFlowbite();
    this.setupRouteListener();
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  /**
   * Scroll to top only in browser environment
   */
  private scrollToTop(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    }
  }

  /**
   * Initialize Flowbite for carousel and other components
   */
  private initializeFlowbite(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.flowbiteService.loadFlowbite((flowbite) => {
        flowbite.initFlowbite();
      });
    }
  }

  /**
   * Set up route parameter listener using switchMap
   */
  private setupRouteListener(): void {
    this.routeSub = this.route.paramMap
      .pipe(
        switchMap(params => {
          const productId = params.get('id');
          this.isLoading.set(true);
          this.hasError.set(false);
          this.product.set(null);
          this.selectedImageIndex.set(0);

          if (!productId) {
            this.hasError.set(true);
            this.isLoading.set(false);
            return [null];
          }

          return this.productService.get(productId);
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.product.set(data);
            this.updateSeoTags(data);
          } else {
            this.hasError.set(true);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading product:', error);
          this.hasError.set(true);
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Update SEO tags for the product
   */
  private updateSeoTags(product: ProductM): void {
    const productTitle = product.title || 'Product';
    const capitalizedTitle = productTitle.charAt(0).toUpperCase() + productTitle.slice(1);
    const brand = product.brand || 'Premium Brand';
    const description = product.description || `High-quality ${productTitle} from ${brand}`;
    const image = product.imageUrl
      ? `${this.ImageApi}${product.imageUrl}`
      : undefined;

    const seoTitle = `${capitalizedTitle} - ${brand} | ${this.companyName}`;
    const seoDescription = `Discover ${productTitle} from ${brand}. ${description}. Available at ${this.companyName} with comprehensive specifications and catalog download.`;


    /* ---------- Meta SEO ---------- */
    this.seoManager.updateSeoData({
      title: seoTitle,
      description: seoDescription,
      type: 'product',
      image,
      keywords: this.generateKeywords(product)
    });

    /* ---------- JSON-LD Product Schema ---------- */
    this.seoManager.setSchema({
      '@type': 'Product',
      name: productTitle,
      description: seoDescription,
      image: image,
      brand: {
        '@type': 'Brand',
        name: brand
      },
      offers: {
        '@type': 'Offer',
        // price: product.price,
        priceCurrency: 'BDT',
        availability: 'https://schema.org/InStock'
      }
    });
  }


  /**
   * Generate SEO keywords from product data
   */
  private generateKeywords(product: ProductM): string[] {
    const keywords = [
      product.title || '',
      product.brand || '',
      product.model || '',
      product.origin || '',
      product.itemDescription || '',
      ...environment.keywords,
      this.companyName
    ].filter(Boolean);

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Download catalog
   */
  downloadCatalog(): void {
    const product = this.product();
    if (!product?.catalogURL) return;

    const catalogUrl = `https://drive.google.com/uc?export=download&id=${product.catalogURL}`;

    if (isPlatformBrowser(this.platformId)) {
      const link = document.createElement('a');
      link.href = catalogUrl;
      link.download = `catalog-${this.generateSlug(product.title)}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Generate slug for URL
   */
  private generateSlug(text: string | null): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Share product
   */
  shareProduct(platform: 'facebook' | 'twitter' | 'linkedin' | 'whatsapp'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const product = this.product();
    if (!product) return;

    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(product.title || '');
    const description = encodeURIComponent(product.description || '');

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description}`,
      whatsapp: `https://wa.me/?text=${title}%20${url}`
    };

    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
  }

  /**
   * Show toast notification
   */
  private showToast(message: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-up z-50';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
}