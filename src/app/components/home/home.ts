import { Component, inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CarouselComponent } from "../shared/carousel/carousel";
import { Hero } from "../shared/hero/hero";
import { ProductsWrapper } from "../shared/products-wrapper/products-wrapper";
import { CarouselM, ProductM } from '../../utils/models';
import { ProductS } from '../../services/product-s';
import { CarouselS } from '../../services/carousel-s';
import { environment } from '../../../environments/environment';
import { SeoManager } from '../../services/seo-manager';

@Component({
  selector: 'app-home',
  imports: [CommonModule, CarouselComponent, Hero, ProductsWrapper],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  carouselService = inject(CarouselS);
  productService = inject(ProductS);
  carousels = signal<CarouselM[]>([]);
  products = signal<ProductM[]>([]);
  renderer = inject(Renderer2);
    seoManager = inject(SeoManager);
  // 1. Inject PLATFORM_ID
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    this.setProductsSeoTags();
    this.loadProducts();
    this.loadCarousels();
    // 2. Wrap the browser-specific code in a platform check
    isPlatformBrowser(this.platformId) && this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }  

  loadCarousels(title = "", description = "", companyID = environment.companyCode) {
    // this.isLoading.set(true);
    // this.hasError.set(false);
    const searchParams = {companyID, title, description}

    this.carouselService.search(searchParams).subscribe({
      next: (data) => {
        data && this.carousels.set(data);
        // this.isLoading.set(false);
      },
      error: () => {
        // this.hasError.set(true);
        // this.isLoading.set(false);
      }
    });
  }

  loadProducts(title = "", description = "", companyID = environment.companyCode) {
    const searchParams = { companyID, title, description }

    this.productService.search(searchParams).subscribe({
      next: (data) => {
        data && this.products.set(data)
      },
      error: () => {
        // this.hasError.set(true);
        // this.isLoading.set(false);
      }
    });
  }

  setProductsSeoTags() {
    this.seoManager.updateSeoData({
      title: 'Home',
      description: '',
      type: 'website',
    });
  }
}
