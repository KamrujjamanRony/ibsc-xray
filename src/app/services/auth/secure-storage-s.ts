import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class SecureStorageS {
  private encryptionKey: string;

  constructor() {
    // In a real app, fetch this from a secure source (not hardcoded)
    this.encryptionKey = this.getEncryptionKey();
  }

  setItem(key: string, value: any): void {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      this.encryptionKey
    ).toString();
    localStorage.setItem(key, encrypted);
  }

  getItem(key: string): any {
    const item = localStorage.getItem(key);
    if (!item) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(item, this.encryptionKey);
      return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
    } catch {
      this.removeItem(key);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  private getEncryptionKey(): string {
    // Implement a secure way to get encryption key
    // This could be from a server API or derived from user context
    return 'your-dynamic-secure-key'; // Don't hardcode in production
  }
  
}
