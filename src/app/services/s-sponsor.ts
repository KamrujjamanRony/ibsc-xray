import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CacheS } from './cache-s';
import { environment } from '../../environments/environment';
import { from, lastValueFrom, map, Observable } from 'rxjs';
import { SponsorM } from '../utils/models';

@Injectable({
  providedIn: 'root',
})
export class SSponsor {
  http = inject(HttpClient);
  cache = inject(CacheS);
  url = `${environment.apiUrl}/ExtraImage`;

  // No cache for create operations
  add(model: SponsorM | FormData): Observable<SponsorM> {
    // Clear relevant cache entries
    this.cache.clear('extra_image_all');
    return this.http.post<SponsorM>(this.url, model);
  }

  // Cached version
  search(params: any): Observable<SponsorM[]> {
    return from(
      this.cache.getOrSet(
        'extra_image_all',
        () => lastValueFrom(this.http.post<SponsorM[]>(`${this.url}/Search`, params)),
        15 // Cache for 15 minutes
      )
    );
  }

  // Cached version
  get(id: string): Observable<SponsorM> {
    return from(
      this.cache.getOrSet(
        `extra_image_item_${id}`,
        () => lastValueFrom(this.http.get<SponsorM>(`${this.url}/${id}`)),
        15 // Cache individual items for 15 minutes
      )
    );
  }

  // Clear cache on update
  update(id: string, updateRequest: SponsorM | FormData): Observable<SponsorM> {
    // Clear relevant cache entries
    this.cache.clear('extra_image_all');
    
    // Extract companyID from the data if it's SponsorM
    if (!(updateRequest instanceof FormData)) {
      this.cache.clear(`extra_image_company_${updateRequest.companyID}`);
    }
    
    this.cache.clear(`extra_image_item_${id}`);
    
    return this.http.put<SponsorM>(`${this.url}/${id}`, updateRequest);
  }

  // Clear cache on delete
  delete(id: string): Observable<SponsorM> {
    return this.http.delete<SponsorM>(`${this.url}/${id}`).pipe(
      map(response => {
        // Clear relevant cache
        this.cache.clear('extra_image_all');
        this.cache.clearByPattern(/^cache_extra_image_company_/); // Clear all company extra_image caches
        this.cache.clear(`extra_image_item_${id}`);
        return response;
      })
    );
  }

  // Optional: Manual refresh
  refresh(): void {
    this.cache.clearByPattern(/^cache_extra_image_/);
  }
  
}
