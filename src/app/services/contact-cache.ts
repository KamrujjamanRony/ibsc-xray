import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { from, lastValueFrom, Observable } from 'rxjs';
import { ContactFormM, ContactM } from '../utils/models';
import { CacheS } from './cache-s';



@Injectable({
  providedIn: 'root',
})
export class ContactCache {
  http = inject(HttpClient);
  cache = inject(CacheS);
  url = `${environment.apiUrl}/Address`;

  // Cached version
  get(id: number = environment.companyCode): Observable<ContactM> {
    return from(
      this.cache.getOrSet(
        `contact_item_${id}`,
        () => lastValueFrom(this.http.get<ContactM>(`${this.url}/${id}`)),
        10
      )
    );
  }

  // Clear cache on update
  update(id: string, updateAddressRequest: ContactM | FormData): Observable<ContactM> {
    // Clear relevant cache entries
    this.cache.clear('contact_all');
    
    // Extract companyID from the data if it's ContactM
    if (!(updateAddressRequest instanceof FormData)) {
      this.cache.clear(`contact_company_${updateAddressRequest.companyID}`);
    }
    
    this.cache.clear(`contact_item_${id}`);
    
    return this.http.put<ContactM>(`${this.url}/${id}`, updateAddressRequest);
  }

  // Optional: Manual refresh
  refreshContact(): void {
    this.cache.clearByPattern(/^cache_contact_/);
  }
  
  // Send contact email
  sendContactEmail(contactData: ContactFormM): Observable<any> {
    return this.http.post(`/api/email/send-contact`, contactData);
  }
  
}
