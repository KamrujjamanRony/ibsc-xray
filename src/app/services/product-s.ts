import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ProductM } from '../utils/models';
import { from, lastValueFrom, map, Observable, tap } from 'rxjs';
import { CacheS } from './cache-s';

@Injectable({
  providedIn: 'root',
})
export class ProductS {
  http = inject(HttpClient);
  cache = inject(CacheS);
  url = `${environment.apiUrl}/Product`;

  add(model: FormData): Observable<ProductM> {
    return this.http.post<ProductM>(this.url, model).pipe(
      tap((newProduct) => {
        // Clear relevant cache entries after successful creation
        this.cache.clearByPattern(/^company_.*_products$/);
        this.cache.clearByPattern(/^product_.*$/);
        this.cache.clear(`company_${environment.companyCode}_products`);
      })
    );
  }

  search(params: any): Observable<ProductM[]> {
    const cacheKey = params.itemId
      ? `company_${environment.companyCode}_item_${params.itemId}_products`
      : `company_${environment.companyCode}_products`;

    return from(
      this.cache.getOrSet(
        cacheKey,
        () => lastValueFrom(this.http.post<ProductM[]>(this.url + "/Search", params)),
        5
      )
    );
  }

  get(id: string): Observable<ProductM> {
    return from(
      this.cache.getOrSet(
        `product_${id}`,
        () => lastValueFrom(this.http.get<ProductM>(`${this.url}/${id}`)),
        10
      )
    );
  }

  update(id: string, updateProductRequest: ProductM): Observable<ProductM> {
    return this.http.put<ProductM>(`${this.url}/${id}`, updateProductRequest).pipe(
      tap((updatedProduct) => {
        // Clear all relevant cache entries after update
        this.clearProductCaches(updatedProduct.companyID.toString(), id);
      })
    );
  }

  delete(id: string, companyId?: string): Observable<ProductM> {
    return this.http.delete<ProductM>(`${this.url}/${id}`).pipe(
      tap(() => {
        // If companyId is not provided in params, we need to clear all company caches
        if (companyId) {
          this.clearProductCaches(companyId, id);
        } else {
          // If no companyId provided, clear all product-related caches
          this.refreshProducts();
        }
      })
    );
  }

  // Helper method to clear all related caches
  private clearProductCaches(companyId: string, productId: string): void {
    // Clear product-specific cache
    this.cache.clear(`product_${productId}`);
    
    // Clear company product lists
    this.cache.clear(`company_${companyId}_products`);
    this.cache.clearByPattern(new RegExp(`^company_${companyId}_item_.*_products$`));
    
    // Clear global product lists
    this.cache.clear('all_products');
    this.cache.clear('all_product_ids');
  }

  // Manual cache refresh
  refreshProducts(): void {
    this.cache.clearByPattern(/^company_.*_products$/); // Clear all company product lists
    this.cache.clearByPattern(/^product_/); // Clear all product details
    this.cache.clear('all_products');
    this.cache.clear('all_product_ids');
  }

  // Optional: Clear cache for a specific company
  clearCompanyProducts(companyId: string): void {
    this.cache.clear(`company_${companyId}_products`);
    this.cache.clearByPattern(new RegExp(`^company_${companyId}_item_.*_products$`));
  }
}