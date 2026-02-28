import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { CarouselM } from '../../../utils/models';
import { CarouselS } from '../../../services/carousel-s';
import { environment } from '../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { PermissionS } from '../../../services/auth/permission-s';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';

@Component({
  selector: 'app-carousel-list',
  imports: [CommonModule, FontAwesomeModule, FormField, NgOptimizedImage],
  templateUrl: './carousel-list.html',
  styleUrl: './carousel-list.css',
  providers: [
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        // config.src is the filename (e.g., 'image.jpg')
        // config.width is the width Angular wants for a specific srcset
        return `${environment.ImageApi + config.src}?w=${config.width}`;
      },
    },
  ],
})
export class CarouselList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  /* ---------------- DI ---------------- */
  private carouselService = inject(CarouselS);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  carousels = signal<CarouselM[]>([]);
  searchQuery = signal('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.carousels()
      .filter(carousel =>
        carousel.title?.toLowerCase().includes(query) ||
        carousel.description?.toLowerCase().includes(query) ||
        String(carousel.companyID ?? '').toLowerCase().includes(query)
      )
      .reverse();
  });

  selected = signal<CarouselM | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

  isLoading = signal(false);
  hasError = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);

  highlightedTr = signal<number>(-1);
  isSubmitted = signal(false);
  showList = signal(true);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    title: '',
    description: '',
    companyID: environment.companyCode,
    imageFile: '',
    imageUrl: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.title, { message: 'Title is required' });

    // Debounce form updates for better performance
    debounce(schemaPath.title, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadCarousels();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Carousel', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Carousel', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Carousel', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Carousel', 'delete'));
  }

  loadCarousels(title = "", description = "", companyID = environment.companyCode) {
    this.isLoading.set(true);
    this.hasError.set(false);
    const searchParams = { companyID, title, description }

    this.carouselService.search(searchParams).subscribe({
      next: (data) => {
        this.carousels.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  /* ---------------- Image File Handler ---------------- */
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  clearFileInput() {
    setTimeout(() => {
      const input = document.getElementById('imageUrl') as HTMLInputElement;
      if (input) {
        input.value = '';
      }
    });
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }


    this.isSubmitted.set(true);

    const formValue = this.form().value();
    const formData = new FormData();

    formData.append('CompanyID', String(formValue.companyID));
    formData.append('Title', formValue.title);
    formData.append('Description', formValue.description ?? '');
    formData.append('ImageUrl', formValue.imageUrl ?? '');
    // ✅ Append file correctly
    if (this.selectedFile()) {
      formData.append('ImageFile', this.selectedFile() as File);
    }


    const request$ = this.selected()
      ? this.carouselService.update(this.selected()!.id, formData)
      : this.carouselService.add(formData);

    request$.subscribe({
      next: () => {
        this.loadCarousels();
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
  onUpdate(carousel: CarouselM) {
    this.selected.set(carousel);

    this.model.update(current => ({
      ...current,
      title: carousel.title,
      description: carousel.description ?? '',
      companyID: carousel.companyID,
      imageUrl: carousel.imageUrl,
    }));

    this.form().reset();
    // Set main image preview
    if (carousel.imageUrl) {
      this.previewUrl.set(
        this.imgURL ? `${this.imgURL}${carousel.imageUrl}` : carousel.imageUrl
      );
    } else {
      this.previewUrl.set(null);
    }

    this.selectedFile.set(null);

    // ✅ Clear file input safely
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.showList.set(false);
  }



  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this Carousel?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete Carousel
      this.carouselService.delete(id).subscribe({
        next: () => {
          this.carousels.update(list => list.filter(c => c.id !== id));
          this.toast.success('Carousel deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('Carousel deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting Carousel:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      title: '',
      description: '',
      companyID: environment.companyCode,
      imageFile: '',
      imageUrl: '',
    });

    this.selected.set(null);
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.isSubmitted.set(false);

    this.form().reset();
    this.clearFileInput();

    // ✅ SAFE way to reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  closeError(e: Event) {
    e.preventDefault();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }
}
