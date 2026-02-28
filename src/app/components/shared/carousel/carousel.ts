import { Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, input, PLATFORM_ID } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, IMAGE_LOADER, ImageLoaderConfig, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { environment } from '../../../../environments/environment';
import { CarouselM } from '../../../utils/models';

@Component({
  selector: 'app-carousel',
  imports: [FontAwesomeModule, CommonModule, NgOptimizedImage],
  templateUrl: './carousel.html',
  styleUrl: './carousel.css',

  // ⚠ REQUIRED FOR SWIPER WEB COMPONENTS
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { ngSkipHydration: '' },
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        // Build the URL for the backend sharp resizer
        const baseUrl = environment.ImageApi.endsWith('/') 
                      ? environment.ImageApi 
                      : `${environment.ImageApi}/`;
      return `${baseUrl}${config.src}?w=${config.width}`;
      },
    },
  ],
})
export class CarouselComponent {
  // 1. Inject PLATFORM_ID
  private platformId = inject(PLATFORM_ID);
  slides = input<CarouselM[]>([]);
  faSpinner = faSpinner;
  ImageApi = environment.ImageApi;
  isBrowser!: boolean;
  // Decide if we have enough slides to support looping/autoplay
  isInteractive = computed(() => this.slides().length > 1);
  // to avoid the 'not enough slides' warning.
  isLoopEnabled = computed(() => this.slides().length >= 3);
  // If slides = [A, B], computedSlides becomes [A, B, A, B]
computedSlides = computed(() => {
  const s = this.slides();
  return (s.length > 0 && s.length < 3) ? [...s, ...s] : s;
});
  constructor(){
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

}
