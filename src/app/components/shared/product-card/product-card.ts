import { Component, computed, input } from '@angular/core';
import { RouterLink } from "@angular/router";
import { environment } from '../../../../environments/environment';
import { ProductM } from '../../../utils/models';
import { IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
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
export class ProductCard {
  product = input<ProductM>();
}
