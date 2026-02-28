import { Component, inject, signal, computed, ViewChild, ElementRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ItemM, ProductM } from '../../../utils/models';
import { environment } from '../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { ProductS } from '../../../services/product-s';
import { PermissionS } from '../../../services/auth/permission-s';
import { MultiSelect } from "../../shared/multi-select/multi-select";
import { FormsModule } from '@angular/forms';
import { ItemS } from '../../../services/item-s';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';

interface RelatedProductOption {
  key: number;
  value: string;
}

interface ImagePreview {
  url: string;
  file: File | null;
  index: number;
  isExisting?: boolean; // New property to track existing vs new images
}

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, FontAwesomeModule, FormField, MultiSelect, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;

  /* ---------------- DI ---------------- */
  private productService = inject(ProductS);
  private itemService = inject(ItemS);
  private permissionService = inject(PermissionS);
    private toast = inject(ToastService);
    private confirm = inject(ConfirmService);
  private platformId = inject(PLATFORM_ID);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('multipleFileInput') multipleFileInput!: ElementRef<HTMLInputElement>;

  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  products = signal<ProductM[]>([]);
  items = signal<ItemM[]>([]);
  relatedProducts: RelatedProductOption[] = [];
  searchQuery = signal('');

  selected = signal<ProductM | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  // New signals for multiple images
  selectedFiles = signal<File[]>([]);
  multiplePreviewUrls = signal<ImagePreview[]>([]);
  existingImages = signal<string[]>([]);

  isLoading = signal(false);
  error = signal({
    message: '',
    type: 'form'
  });

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  highlightedTr = signal<number>(-1);
  isSubmitted = signal(false);
  showList = signal(true);

  /* ---------------- COMPUTED ---------------- */
  filteredProductList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.products()
      .filter(product =>
        product.title?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        String(product.companyID ?? '').toLowerCase().includes(query)
      )
      .sort((a, b) => (a.sl! - b.sl!));
  });

  relatedProductOptions = computed(() =>
    this.products().map(product => ({
      key: product.id,
      value: product.title
    }))
  );

  itemOptions = computed(() =>
    this.items().map(item => ({
      key: item.id,
      value: item.description || ''
    }))
  );

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    title: '',
    description: '',
    itemId: '',
    brand: '',
    model: '',
    origin: '',
    additionalInformation: '',
    specialFeature: '',
    catalogURL: '',
    sl: '',
    companyID: environment.companyCode,
    imageFile: '',
    imageFiles: '',
    imageUrl: '',
    images: [] as any[],
    relatedProducts: [] as any[],
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.title, { message: 'Title is required' });
    validate(schemaPath.sl, ({ value }) => {
      const numberRegex = /^\d+$/;
      if (!numberRegex.test(value())) {
        return {
          kind: 'complexity',
          message: 'Product SL must be a valid number'
        }
      }
      return null
    })

    debounce(schemaPath.title, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadProducts();
    this.loadPermissions();
    this.loadItems();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Product', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Product', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Product', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Product', 'delete'));
  }

  loadProducts(title = "", description = "", companyID = environment.companyCode) {
    this.isLoading.set(true);
    this.error.set({ message: '', type: 'load' });
    const searchParams = { companyID, title, description }

    this.productService.search(searchParams).subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set({ message: 'Failed to load products.', type: 'load' });
        this.isLoading.set(false);
      }
    });
  }

  loadItems(companyID = environment.companyCode) {
    this.itemService.search({ companyID }).subscribe({
      next: (data) => {
        // Process items if needed
        this.items.set(data);
      },
      error: (error) => {
        console.error('Error loading items:', error);
      }
    });
  }

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  /* ---------------- Image File Handlers ---------------- */
  onMainImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }



  onMultipleImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const newPreviews: ImagePreview[] = [];

    if (input.files && input.files.length > 0) {
      // Convert FileList to array
      const files = Array.from(input.files);

      // Get current existing previews count
      const existingPreviews = this.multiplePreviewUrls().filter(p => p.isExisting);
      const newFilesStartIndex = existingPreviews.length;

      // Add new files to selected files
      const currentFiles = this.selectedFiles();
      const updatedFiles = [...currentFiles, ...files];
      this.selectedFiles.set(updatedFiles);

      // Create previews for new files only
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview: ImagePreview = {
            url: e.target?.result as string,
            file: file,
            index: newFilesStartIndex + index,
            isExisting: false // Mark as new image
          };
          newPreviews.push(preview);

          // When all new previews are loaded, update the signal
          if (newPreviews.length === files.length) {
            this.multiplePreviewUrls.update(current => [...current, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeMultipleImagePreview(index: number) {
    const previews = this.multiplePreviewUrls();
    const previewToRemove = previews[index];

    if (!previewToRemove) return;

    // If it's an existing image (not a newly uploaded file)
    if (previewToRemove.isExisting) {
      // Just remove from previews but don't remove from files array
      this.multiplePreviewUrls.update(previews =>
        previews.filter((_, i) => i !== index)
      );

      // Update indices
      this.multiplePreviewUrls.update(previews =>
        previews.map((preview, i) => ({
          ...preview,
          index: i
        }))
      );
    } else {
      // It's a newly uploaded file - remove from both previews and selected files
      // Find the file index in selectedFiles
      const fileIndex = index - this.multiplePreviewUrls().filter(p => p.isExisting).length;

      this.multiplePreviewUrls.update(previews =>
        previews.filter((_, i) => i !== index)
      );

      this.selectedFiles.update(files =>
        files.filter((_, i) => i !== fileIndex)
      );

      // Update indices for remaining previews
      this.multiplePreviewUrls.update(previews =>
        previews.map((preview, i) => ({
          ...preview,
          index: i
        }))
      );
    }
  }

  // Update the filter function in onSubmit
  private filterImagesByPreviewUrls(images: string[], previewUrls: ImagePreview[]): string[] {
    if (!images || !Array.isArray(images)) return [];
    if (!previewUrls || !Array.isArray(previewUrls)) return images;

    // Only keep images that have corresponding previews marked as existing
    return images.filter(image => {
      return previewUrls.some(preview => {
        if (!preview.isExisting) return false; // Only consider existing images

        // Extract filename from preview URL
        const urlParts = preview.url.split('/');
        const previewFilename = urlParts[urlParts.length - 1];

        // Check if image matches the preview filename
        return image === previewFilename || previewFilename.includes(image);
      });
    });
  }

  clearFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  clearMultipleFileInput() {
    if (this.multipleFileInput) {
      this.multipleFileInput.nativeElement.value = '';
    }
  }

  // Convert RelatedProductOption[] to string[] (just keys)
  getRelatedProductKeys(relatedProduct: RelatedProductOption[]): number[] {
    return relatedProduct.map(p => p.key);
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);
    this.error.set({ message: '', type: 'form' });

    const formValue = this.form().value();

    const payload = {
      companyID: formValue.companyID,
      title: formValue.title,
      description: formValue.description,
      itemId: formValue.itemId,
      brand: formValue.brand,
      model: formValue.model,
      origin: formValue.origin,
      additionalInformation: formValue.additionalInformation,
      specialFeature: formValue.specialFeature,
      catalogURL: formValue.catalogURL,
      sl: Number(formValue.sl),
      imageUrl: formValue.imageUrl,
      images: this.filterImagesByPreviewUrls(formValue.images, this.multiplePreviewUrls()),
      relatedProducts: this.getRelatedProductKeys(this.relatedProducts),
    };
    console.log(payload);

    const formData = new FormData();

    // Append form fields
    formData.append('CompanyID', String(payload.companyID));
    formData.append('Title', payload.title);
    formData.append('Description', payload.description ?? '');
    formData.append('ItemId', payload.itemId ?? '');
    formData.append('Brand', payload.brand ?? '');
    formData.append('Model', payload.model ?? '');
    formData.append('Origin', payload.origin ?? '');
    formData.append('AdditionalInformation', payload.additionalInformation ?? '');
    formData.append('SpecialFeature', payload.specialFeature ?? '');
    formData.append('CatalogURL', payload.catalogURL ?? '');
    formData.append('SL', String(payload.sl));
    formData.append('ImageUrl', payload.imageUrl ?? '');

    // Append Images
    payload.images.forEach((img) => {
      formData.append('Images', img);
    });

    // Append related products
    payload.relatedProducts.forEach((prodId) => {
      formData.append('RelatedProducts', prodId.toString());
    });

    // ✅ Append main image file
    if (this.selectedFile()) {
      formData.append('ImageFile', this.selectedFile() as File);
    }

    // ✅ Append multiple image files
    const multipleFiles = this.selectedFiles();
    if (multipleFiles.length > 0) {
      multipleFiles.forEach((file, index) => {
        formData.append('ImageFiles', file); // Use same name for backend
      });
    }

    const request$ = this.selected()
      ? this.productService.update(this.selected()!.id, formData as any)
      : this.productService.add(formData);

    request$.subscribe({
      next: () => {
        this.loadProducts();
        this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        this.isSubmitted.set(false);
        console.error(error?.message || error?.error?.message || 'An error occurred during submission.');
        this.toast.danger('Saved unsuccessful!', 'bottom-left', 3000);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(product: ProductM) {
    this.selected.set(product);

    // Convert related products
    if (product.relatedProducts) {
      this.relatedProducts = this.relatedProductOptions().filter(option =>
        product.relatedProducts!.includes(option.key)
      );
    } else {
      this.relatedProducts = [];
    }

    // Store existing images separately for reference
    this.existingImages.set(product.images || []);

    // Update form model
    this.model.update(current => ({
      ...current,
      title: product.title,
      description: product.description ?? '',
      companyID: product.companyID,
      itemId: product.itemId ?? '',
      brand: product.brand ?? '',
      model: product.model ?? '',
      origin: product.origin ?? '',
      additionalInformation: product.additionalInformation ?? '',
      specialFeature: product.specialFeature ?? '',
      catalogURL: product.catalogURL ?? '',
      sl: product.sl?.toString() ?? '',
      imageUrl: product.imageUrl ?? '',
      images: product.images ?? [],
      relatedProducts: this.relatedProductOptions().filter(rp => product.relatedProducts?.includes(rp.key)) || [],
    }));

    this.form().reset();

    // Set main image preview
    if (product.imageUrl) {
      this.previewUrl.set(
        this.imgURL ? `${this.imgURL}${product.imageUrl}` : product.imageUrl
      );
    } else {
      this.previewUrl.set(null);
    }

    // Reset main image file
    this.selectedFile.set(null);

    // Set multiple image previews if exists - use imgURL
    if (product.images && product.images.length > 0) {
      const previews: ImagePreview[] = [];
      product.images.forEach((image, index) => {
        previews.push({
          url: this.imgURL ? `${this.imgURL}${image}` : image,
          file: null, // null for existing images
          index: index,
          isExisting: true // Mark as existing image
        });
      });
      this.multiplePreviewUrls.set(previews);
      this.selectedFiles.set([]); // No new files selected for existing images
    } else {
      this.multiplePreviewUrls.set([]);
      this.selectedFiles.set([]);
    }

    // Clear file inputs
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    if (this.multipleFileInput) {
      this.multipleFileInput.nativeElement.value = '';
    }
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this Product?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete Carousel
      this.productService.delete(id).subscribe({
        next: () => {
          this.products.update(list => list.filter(c => c.id !== id));
          this.toast.success('Product deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Product deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting Product:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      title: '',
      description: '',
      itemId: '',
      brand: '',
      model: '',
      origin: '',
      additionalInformation: '',
      specialFeature: '',
      catalogURL: '',
      sl: '',
      companyID: environment.companyCode,
      imageFile: '',
      imageFiles: '',
      imageUrl: '',
      images: [],
      relatedProducts: [],
    });

    this.relatedProducts = [];
    this.selected.set(null);

    // Reset image states
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.selectedFiles.set([]);
    this.multiplePreviewUrls.set([]);

    this.isSubmitted.set(false);
    this.form().reset();

    // Clear file inputs
    this.clearFileInput();
    this.clearMultipleFileInput();
  }

  closeError(e: Event) {
    e.preventDefault();
    this.error.set({ message: '', type: 'form' });
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

  /**
   * Download catalog
   */
  downloadCatalog(item: any): void {

    const catalogUrl = `https://drive.google.com/uc?export=download&id=${item?.catalogURL}`;
    console.log(catalogUrl);

    if (isPlatformBrowser(this.platformId)) {
      const link = document.createElement('a');
      link.href = catalogUrl;
      link.download = `catalog-${this.generateSlug(item.title)}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Generate slug for URL
   */
  private generateSlug(text: string | null): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}