import { Component, inject, PLATFORM_ID, Renderer2, signal, OnInit } from '@angular/core';
import { IMAGE_LOADER, ImageLoaderConfig, isPlatformBrowser } from '@angular/common';
import { AboutM } from '../../utils/models';
import { AboutS } from '../../services/about-s';
import { SeoManager } from '../../services/seo-manager';
import { environment } from '../../../environments/environment';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { PageTitle } from "../shared/page-title/page-title";

@Component({
  selector: 'app-about',
  imports: [CommonModule, NgOptimizedImage, PageTitle],
  templateUrl: './about.html',
  styleUrl: './about.css',
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
export class About implements OnInit {
  aboutService = inject(AboutS);
  about = signal<AboutM>({} as AboutM);
  renderer = inject(Renderer2);
  seoManager = inject(SeoManager);
  private platformId = inject(PLATFORM_ID);
  imgUrl = environment.ImageApi;

  ngOnInit() {
    this.setProductsSeoTags();
    this.aboutService.get(environment.companyCode).subscribe(data => data && this.about.set(data));
    isPlatformBrowser(this.platformId) && this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }

  setProductsSeoTags() {
    this.seoManager.updateSeoData({
      title: 'About Us',
      description: 'Learn about our company, mission, and values',
      type: 'website',
    });
  }
}