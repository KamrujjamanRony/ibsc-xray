import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CacheS } from './cache-s';
import { environment } from '../../environments/environment';
import { ItemM } from '../utils/models';
import { from, lastValueFrom, map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ItemCache {
  http = inject(HttpClient);
  cache = inject(CacheS);
  url = `${environment.apiUrl}/Item`;

  // Create new item
  add(item: ItemM | FormData): Observable<ItemM> {
    // Clear relevant cache entries
    this.cache.clear('item_all');
    return this.http.post<ItemM>(this.url, item);
  }

  // Get all items (cached)
  search(params: any): Observable<ItemM[]> {
    return from(
      this.cache.getOrSet(
        'item_all',
        () => lastValueFrom(this.http.post<ItemM[]>(`${this.url}/Search`, params)),
        15 // Cache for 15 minutes
      )
    );
  }

  // Get single item by ID (cached)
  get(id: number): Observable<ItemM> {
    return from(
      this.cache.getOrSet(
        `item_${id}`,
        () => lastValueFrom(this.http.get<ItemM>(`${this.url}/${id}`)),
        15 // Cache individual items for 15 minutes
      )
    );
  }

  // Update item
  update(id: number, itemData: ItemM | FormData): Observable<ItemM> {
    // Clear relevant cache entries
    this.cache.clear('item_all');
    
    // Extract companyID from the data if it's ItemM
    if (!(itemData instanceof FormData)) {
      this.cache.clear(`item_company_${itemData.companyID}`);
    }
    
    this.cache.clear(`item_${id}`);
    
    return this.http.put<ItemM>(`${this.url}/${id}`, itemData);
  }

  // Delete item
  delete(id: number): Observable<ItemM> {
    return this.http.delete<ItemM>(`${this.url}/${id}`).pipe(
      map(response => {
        // Clear relevant cache
        this.cache.clear('item_all');
        this.cache.clearByPattern(/^cache_item_company_/); // Clear all company item caches
        this.cache.clear(`item_${id}`);
        return response;
      })
    );
  }

  // Manual cache refresh
  refreshItems(): void {
    this.cache.clearByPattern(/^cache_item_/);
  }
  
}
