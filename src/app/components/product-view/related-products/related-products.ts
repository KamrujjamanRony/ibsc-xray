import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, Input, PLATFORM_ID, Renderer2, signal, SimpleChanges } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ProductM } from '../../../utils/models';
import { ProductS } from '../../../services/product-s';
import { ProductCard } from "../../shared/product-card/product-card";

@Component({
  selector: 'app-related-products',
  imports: [CommonModule, ProductCard],
  templateUrl: './related-products.html',
  styleUrl: './related-products.css',
})
export class RelatedProducts {
  private productService = inject(ProductS);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);
  
  @Input() productIds: number[] = [];
  @Input() limit: number = 4;
  
  readonly ImageApi = environment.ImageApi;
  
  products = signal<ProductM[]>([]);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    // When the ID input changes, load the product
    if (changes['productIds'] && this.productIds) {
      this.loadRelatedProducts(this.productIds);
    isPlatformBrowser(this.platformId) && this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    }
  }

  /**
   * Load related products
   */
  private loadRelatedProducts(productIds: number[]): void {
    if (!this.productIds || this.productIds.length === 0) {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    // Get unique product IDs (excluding current product if needed)
    const uniqueIds = [...new Set(this.productIds)].slice(0, this.limit);

    // In a real application, you would have an API endpoint for related products
    // For now, we'll fetch each product individually (not optimal for production)
    const productPromises = uniqueIds.map(id => 
      this.productService.get(id.toString()).toPromise()
    );

    Promise.all(productPromises)
      .then(products => {
        const validProducts = products.filter(p => p !== null && p !== undefined) as ProductM[];
        this.products.set(validProducts);
        this.isLoading.set(false);
      })
      .catch(error => {
        console.error('Error loading related products:', error);
        this.hasError.set(true);
        this.isLoading.set(false);
      });
  }

  /**
   * Generate product slug for URL
   */
  generateSlug(title: string | null): string {
    if (!title) return '';
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /**
   * Navigate to product
   */
  navigateToProduct(product: ProductM): void {
    // Navigation is handled by routerLink in template
  }

}
