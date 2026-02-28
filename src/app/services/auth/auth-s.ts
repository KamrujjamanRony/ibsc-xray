import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class AuthS {
  private memoryCache: any = null;
  private storageKey = '*_*';
  private encryptionKey = 'your-dynamic-key'; // In production, fetch from API/backend
  private platformId = inject(PLATFORM_ID);
  private router: Router = inject(Router);

  constructor() {
    // Restore from secure storage on service init
    this.restoreUser();    // todo: remove this.restoreUser()

    // Backup to secure storage before page unload
    window.addEventListener('beforeunload', () => this.backupUser());      // todo: this.backupUser()   // todo: this.deleteUser()
  }

  setUser(user: any) {
    this.memoryCache = user;
    this.backupUser(); // Optional: Persist immediately
  }

  getUser() {
    return this.memoryCache;
  }

  deleteUser() {
    this.memoryCache = null;
    localStorage.removeItem(this.storageKey);
    this.router.navigate(['/login']);
  }

  private backupUser() {
    if (this.memoryCache) {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(this.memoryCache),
        this.encryptionKey
      ).toString();
      localStorage.setItem(this.storageKey, encrypted);
    }
  }

  private restoreUser() {
    if (isPlatformBrowser(this.platformId)) {
    const encrypted = localStorage.getItem(this.storageKey);
    if (encrypted) {
      try {
        const decrypted = CryptoJS.AES.decrypt(
          encrypted,
          this.encryptionKey
        ).toString(CryptoJS.enc.Utf8);
        this.memoryCache = JSON.parse(decrypted);
      } catch (e) {
        this.deleteUser(); // Clear corrupted data
      }
    }
  }
  }

  // Hash password before sending to server
  hashPassword(password: string): string {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const iterations = 10000;
    const keySize = 256;

    return CryptoJS.PBKDF2(password, salt, {
      keySize: keySize / 32,
      iterations: iterations
    }).toString() + ':' + salt + ':' + iterations;
  }
  
}
