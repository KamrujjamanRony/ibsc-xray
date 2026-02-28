// seo-manager.ts
import { DOCUMENT, inject, Injectable, REQUEST } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SeoData {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  keywords?: string[] | string;
}

@Injectable({
  providedIn: 'root',
})
export class SeoManager {
  private title = inject(Title);
  private meta = inject(Meta);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private document = inject(DOCUMENT);
  private request = inject(REQUEST, { optional: true });

  private readonly siteName = environment.companyName;
  private readonly defaultDescription =
    `${this.siteName} is a premier provider of advanced medical imaging solutions, specializing in the distribution, installation, and maintenance of state-of-the-art X-ray equipment. With a commitment to excellence in healthcare technology, IBSC bridges the gap between innovative medical imaging manufacturers and healthcare providers seeking reliable diagnostic solutions.`;
  private readonly defaultImage =
    `https://www.dummyimage.com/600x400/000/fff&text=${this.siteName}`;

  /* =========================
     META + SOCIAL SEO
  ========================== */
  updateSeoData(seo: SeoData): void {
    const title = this.buildTitle(seo.title);
    const description = seo.description || this.defaultDescription;
    const image = seo.image || this.defaultImage;
    const type = seo.type || 'website';
    const url = this.normalizeUrl(this.getFullUrl());
    const preload = this.document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = image;
    this.document.head.appendChild(preload);


    /* -------- Title -------- */
    this.title.setTitle(title);

    /* -------- Basic SEO -------- */
    this.meta.updateTag({ name: 'description', content: description });

    /* -------- Keywords -------- */
    if (seo.keywords) {
      const keywords = Array.isArray(seo.keywords)
        ? seo.keywords.join(', ')
        : seo.keywords;

      this.meta.updateTag({ name: 'keywords', content: keywords });
    } else {
      this.meta.removeTag("name='keywords'");
    }

    /* -------- Open Graph -------- */
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: title });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });

    /* -------- Twitter -------- */
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    /* -------- Canonical -------- */
    this.setCanonical(url);
  }

  /* =========================
     ROUTE SEO
  ========================== */
  init() {
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        map(() => this.route),
        map(route => {
          while (route.firstChild) route = route.firstChild;
          return route;
        }),
        mergeMap(route => route.data)
      )
      .subscribe(data => {
        this.setMeta(data);
        this.setRouteSchema(data);
      });
  }

  /* =========================
     JSON-LD STRUCTURED DATA
  ========================== */
  setSchema(schema: Record<string, any>): void {
    this.removeSchema();

    if (!this.document?.head) return;

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'structured-data';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      ...schema,
    });

    this.document.head.appendChild(script);
  }

  private setRouteSchema(data: any) {
    this.removeSchema();

    if (!data['schema']) return;

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      ...data['schema']
    });

    script.id = 'structured-data';
    this.document.head.appendChild(script);
  }

  private removeSchema(): void {
    const el = this.document.getElementById('structured-data');
    if (el) el.remove();
  }

  /* =========================
     HELPERS
  ========================== */
  private setCanonical(url: string): void {
    let link = this.document.querySelector("link[rel='canonical']");
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private buildTitle(pageTitle: string): string {
    return pageTitle.includes(this.siteName)
      ? pageTitle
      : `${pageTitle} | ${this.siteName}`;
  }

  private normalizeUrl(url: string): string {
    return url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
  }

  private getFullUrl(): string {
    if (this.request) {
      const headers = this.request.headers as Headers;
      const proto = headers.get('x-forwarded-proto') || 'https';
      const host = headers.get('x-forwarded-host') || headers.get('host');
      return `${proto}://${host}${this.router.url}`;
    }
    return window.location.origin + this.router.url;
  }

  private setMeta(data: any) {
    if (data['title']) this.title.setTitle(data['title']);

    if (data['description']) {
      this.meta.updateTag({ name: 'description', content: data['description'] });
    }

    if (data['keywords']) {
      this.meta.updateTag({ name: 'keywords', content: data['keywords'] });
    }
  }
}
