import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, lastValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheS } from '../cache-s';

@Injectable({
  providedIn: 'root',
})
export class UserCache {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheS);

  private readonly url = `${environment.apiUrl}/User`;

  /* ---------------- ADD ---------------- */

  addUser(model: any): Observable<any> {
    this.clearUserCache();
    return this.http.post<any>(this.url, model, { withCredentials: true });
  }

  /* ---------------- GET ALL / SEARCH ---------------- */
  getUser(query: any): Observable<any[]> {
    return from(
      this.cache.getOrSet(
        'users_all',
        () =>
          lastValueFrom(
            this.http.post<any[]>(
              `${this.url}/Search`,
              query,
              // { withCredentials: true }
            )
          ),
        15
      )
    );
  }

  /* ---------------- GET SINGLE ---------------- */
  getUserById(id: string | number): Observable<any> {
    return from(
      this.cache.getOrSet(
        `user_${id}`,
        () =>
          lastValueFrom(
            this.http.get<any>(`${this.url}/${id}`, { withCredentials: true })
          ),
        15
      )
    );
  }

  /* ---------------- UPDATE ---------------- */
  updateUser(id: string | number, updateUserRequest: any): Observable<any> {
    const req = {
      ...updateUserRequest,
      userId: id
    };

    this.clearUserCache(id);

    return this.http.put<any>(
      `${this.url}/${id}?userId=${id}`,
      req,
      // { withCredentials: true }
    );
  }

  /* ---------------- DELETE ---------------- */
  deleteUser(id: string | number): Observable<any> {
    this.clearUserCache(id);

    return this.http
      .delete<any>(`${this.url}/${id}`, 
        // { withCredentials: true }
      )
      .pipe(
        map(res => {
          this.cache.clear(`user_${id}`);
          return res;
        })
      );
  }

  /* ---------------- CACHE HELPERS ---------------- */
  private clearUserCache(id?: string | number) {
    this.cache.clear('users_all');
    if (id !== undefined) {
      this.cache.clear(`user_${id}`);
    }
  }

  refreshUsers(): void {
    this.cache.clear('users_all');
    this.cache.clearByPattern(/^cache_user_/);
  }
}
