import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, lastValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheS } from '../cache-s';

@Injectable({
  providedIn: 'root',
})
export class MenuCache {
  private readonly http = inject(HttpClient);
  private readonly cache = inject(CacheS);

  private readonly url = `${environment.apiUrl}/Menu`;

  /* ---------------- ADD ---------------- */
  addMenu(model: any): Observable<any> {
    this.clearMenuCache();
    return this.http.post<any>(this.url, model);
  }

  /* ---------------- GET ALL ---------------- */
  getAllMenu(): Observable<any[]> {
    return from(
      this.cache.getOrSet(
        'menus_all',
        () =>
          lastValueFrom(
            this.http.post<any[]>(`${this.url}/Search`, {})
          ),
        15
      )
    );
  }

  /* ---------------- GET SINGLE ---------------- */
  getMenu(id: number | string): Observable<any> {
    return from(
      this.cache.getOrSet(
        `menu_${id}`,
        () =>
          lastValueFrom(
            this.http.get<any>(`${this.url}/${id}`)
          ),
        15
      )
    );
  }

  /* ---------------- UPDATE ---------------- */

  updateMenu(id: number | string, updateRequest: any): Observable<any> {
    this.clearMenuCache(id);
    return this.http.put<any>(
      `${this.url}/${id}`,
      updateRequest
    );
  }

  /* ---------------- DELETE ---------------- */
  deleteMenu(id: number | string): Observable<any> {
    this.clearMenuCache(id);
    return this.http.delete<any>(`${this.url}/${id}`).pipe(
      map(res => {
        this.cache.clear(`menu_${id}`);
        return res;
      })
    );
  }

  /* ---------------- TREE DATA ---------------- */
  generateTreeData(userId: number | string): Observable<any> {
    return from(
      this.cache.getOrSet(
        `menu_tree_user_${userId}`,
        () =>
          lastValueFrom(
            this.http.get<any>(
              `${this.url}/GenerateTreeData?userId=${userId}`
            )
          ),
        15
      )
    );
  }

  /* ---------------- CACHE HELPERS ---------------- */
  private clearMenuCache(id?: number | string) {
    this.cache.clear('menus_all');
    this.cache.clearByPattern(/^cache_menu_tree_user_/);
    if (id !== undefined) {
      this.cache.clear(`menu_${id}`);
    }
  }

  refreshMenus(): void {
    this.cache.clear('menus_all');
    this.cache.clearByPattern(/^cache_menu_/);
    this.cache.clearByPattern(/^cache_menu_tree_/);
  }
}
