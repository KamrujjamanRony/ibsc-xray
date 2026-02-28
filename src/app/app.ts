import { Component, inject, PLATFORM_ID, Renderer2, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../environments/environment';
import { SeoManager } from './services/seo-manager';
import { Toast } from "./utils/toast/toast";
import { Confirm } from "./utils/confirm/confirm";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, Confirm],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal(environment.companyName);
  private seo = inject(SeoManager);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.seo.init();
    isPlatformBrowser(this.platformId) && this.renderer.setProperty(document.documentElement, 'scrollTop', 0);
  }
}
