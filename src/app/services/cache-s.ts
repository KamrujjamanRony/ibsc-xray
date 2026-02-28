import { Injectable, signal, inject, TransferState, makeStateKey, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class CacheS {
  private transferState = inject(TransferState);
  // 1. Inject PLATFORM_ID
  private platformId = inject(PLATFORM_ID);

  // Simple signal cache store
  private cache = signal<Map<string, { data: any; timestamp: number }>>(new Map());

  // Get from cache or execute function
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlMinutes = 15): Promise<T> {
    const cacheKey = `cache_${key}`;
    const now = Date.now();
    const ttlMs = ttlMinutes * 60 * 1000;

    // Check server transfer state (SSR)
    if (isPlatformServer(this.platformId)) {
      const stateKey = makeStateKey<T>(cacheKey);
      if (this.transferState.hasKey(stateKey)) {
        return this.transferState.get(stateKey, null as any);
      }
    }
    
    if (isPlatformServer(this.platformId)) {
      const stateKey = makeStateKey<T>(cacheKey);
      const data = await fetchFn();
      this.transferState.set(stateKey, data);
      this.cache.update(map => new Map(map.set(cacheKey, { data, timestamp: now })));
      return data;
    }

    // Check browser memory cache
    const cached = this.cache().get(cacheKey);
    if (cached && (now - cached.timestamp < ttlMs)) {
      return cached.data;
    }

    // Check browser transfer state
    const stateKey = makeStateKey<T>(cacheKey);
    const transferred = this.transferState.get(stateKey, null as any);
    if (transferred) {
      this.transferState.remove(stateKey);
      this.cache.update(map => new Map(map.set(cacheKey, { data: transferred, timestamp: now })));
      return transferred;
    }

    // Fetch and cache
    const data = await fetchFn();
    this.cache.update(map => new Map(map.set(cacheKey, { data, timestamp: now })));
    return data;
  }

  // Clear specific cache by key
  clear(key: string): void {
    const cacheKey = `cache_${key}`;
    this.cache.update(map => {
      const newMap = new Map(map);
      newMap.delete(cacheKey);
      return newMap;
    });
  }

  // NEW: Clear cache by regex pattern
  clearByPattern(pattern: RegExp): void {
    this.cache.update(map => {
      const newMap = new Map(map);
      for (const key of newMap.keys()) {
        if (pattern.test(key)) {
          newMap.delete(key);
        }
      }
      return newMap;
    });
  }

  // Clear all cache
  clearAll(): void {
    this.cache.set(new Map());
  }

}
