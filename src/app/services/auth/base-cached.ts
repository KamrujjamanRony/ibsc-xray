import { signal, WritableSignal } from '@angular/core';

interface CacheEntry<T> {
  value: WritableSignal<T | null>;
  expiresAt: number;
}

export abstract class BaseCached {
  private cache = new Map<string, CacheEntry<any>>();
  protected debug = false; // 🔥 toggle cache logs

  protected getFromCache<T>(
    key: string,
    ttlMinutes: number,
    fetcher: () => Promise<T>
  ): WritableSignal<T | null> {

    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && cached.expiresAt > now) {
      this.log(`CACHE HIT → ${key}`);
      return cached.value;
    }

    this.log(`CACHE MISS → ${key}`);

    const sig = signal<T | null>(cached?.value() ?? null);

    fetcher()
      .then(data => {
        sig.set(data);
        this.cache.set(key, {
          value: sig,
          expiresAt: now + ttlMinutes * 60_000,
        });
        this.log(`CACHE SET → ${key} (${ttlMinutes} min)`);
      })
      .catch(err => {
        this.log(`CACHE ERROR → ${key}`, err);
      });

    return sig;
  }

  protected clearCache(key: string) {
    this.cache.delete(key);
    this.log(`CACHE CLEARED → ${key}`);
  }

  protected clearByPrefix(prefix: string) {
    [...this.cache.keys()]
      .filter(k => k.startsWith(prefix))
      .forEach(k => this.clearCache(k));
  }

  protected clearAll() {
    this.cache.clear();
    this.log(`CACHE CLEARED → ALL`);
  }

  private log(message: string, data?: any) {
    if (this.debug) {
      console.log(`🧠 CacheService :: ${message}`, data ?? '');
    }
  }
}
