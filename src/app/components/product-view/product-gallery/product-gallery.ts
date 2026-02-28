import { Component, Input, signal } from '@angular/core';

interface GalleryImage {
  src: string;
  alt: string;
  thumbnail: string;
}

@Component({
  selector: 'app-product-gallery',
  imports: [],
  templateUrl: './product-gallery.html',
  styleUrl: './product-gallery.css',
})
export class ProductGallery {
  @Input() images: GalleryImage[] = [];
  @Input() ImageApi: string = '';
  
  selectedImageIndex = signal<number>(0);
  isFullscreen = signal<boolean>(false);

  /**
   * Select image by index
   */
  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  /**
   * Navigate to next image
   */
  nextImage(): void {
    if (this.images.length === 0) return;
    const nextIndex = (this.selectedImageIndex() + 1) % this.images.length;
    this.selectedImageIndex.set(nextIndex);
  }

  /**
   * Navigate to previous image
   */
  prevImage(): void {
    if (this.images.length === 0) return;
    const prevIndex = (this.selectedImageIndex() - 1 + this.images.length) % this.images.length;
    this.selectedImageIndex.set(prevIndex);
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): void {
    this.isFullscreen.set(!this.isFullscreen());
    
    if (this.isFullscreen() && typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    } else if (!this.isFullscreen() && typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  /**
   * Handle keyboard navigation in fullscreen mode
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isFullscreen()) return;
    
    if (event.key === 'Escape') {
      this.toggleFullscreen();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    }
  }

}
