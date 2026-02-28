import { Component, inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { ProductsWrapper } from "../shared/products-wrapper/products-wrapper";
import { isPlatformBrowser } from '@angular/common';
import { ProductM } from '../../utils/models';
import { ProductS } from '../../services/product-s';
import { environment } from '../../../environments/environment';
import { SeoManager } from '../../services/seo-manager';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-products',
  imports: [ProductsWrapper],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductS);
  private readonly seoManager = inject(SeoManager);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  readonly categoryName = signal<any>("");
  readonly products = signal<ProductM[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);

  ngOnInit(): void {
    this.subscribeToRouteParams();
    this.scrollToTopOnBrowser();
  }

  /**
   * Subscribe to route parameters
   */
  private subscribeToRouteParams(): void {
    this.route.paramMap.subscribe(params => {
      const itemId = params.get('itemId');
      const itemSlug = params.get('itemSlug');
      
      // If both parameters are present
      if (itemSlug) {
        this.categoryName.set(itemSlug.replace(/-/g, ' '));
        this.setProductsSeoTags(this.categoryName());
      } 
      // If only ID is present (backward compatibility)
      if (itemId) {
        this.loadProducts(Number(itemId));
      }
      // Load all products
      else {
        this.loadProducts(null);
      }
    });
  }

  /**
   * Scroll to top only in browser environment
   */
  private scrollToTopOnBrowser(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
    }
  }

  /**
   * Load products based on search parameters
   */
  loadProducts(
    itemId: number | null, 
    title: string = '', 
    description: string = '', 
    companyID: number = environment.companyCode
  ): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    const searchParams = itemId 
      ? { companyID, itemId, title, description } 
      : { companyID, title, description };

    this.productService.search(searchParams).subscribe({
      next: (data) => {
        this.isLoading.set(false);
        if (data && data.length > 0) {
          this.products.set(data);
        } else {
          this.products.set([]);
          // Optional: Redirect to all products if none found
          this.router.navigate(['/products']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        console.error('Error loading products:', error);
      }
    });
  }

  setProductsSeoTags(category: string) {
    const categoryTitle = category ? `${category}` : '';
    const seoTitle = categoryTitle ? `Products in ${categoryTitle}` : `All Products`;
    const seoDescription = categoryTitle
      ? `Explore our wide range of medical products in the ${categoryTitle} category at ${environment.companyName}. Quality healthcare solutions for all your needs.`
      : `Explore our wide range of medical products at ${environment.companyName}. Quality healthcare solutions for all your needs.`;
    this.seoManager.updateSeoData({
      title: seoTitle,
      description: seoDescription,
      type: 'product',
    });
  }
}
