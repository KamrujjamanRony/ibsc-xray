import { CommonModule, IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';
import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { environment } from '../../../../environments/environment';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { PermissionS } from '../../../services/auth/permission-s';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';
import { SponsorM } from '../../../utils/models';
import { SSponsor } from '../../../services/s-sponsor';

@Component({
  selector: 'app-extra-image-list',
  imports: [CommonModule, FontAwesomeModule, FormField, NgOptimizedImage],
  templateUrl: './extra-image-list.html',
  styleUrl: './extra-image-list.css',
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
export class ExtraImageList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  /* ---------------- DI ---------------- */
  private sponsorService = inject(SSponsor);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  imgURL = environment.ImageApi;
  emptyImg = environment.emptyImg;

  /* ---------------- SIGNAL STATE ---------------- */
  sponsors = signal<SponsorM[]>([]);
  searchQuery = signal('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.sponsors()
      .filter(sponsor =>
        sponsor.eTitle?.toLowerCase().includes(query) ||
        sponsor.eDesc?.toLowerCase().includes(query) ||
        String(sponsor.companyID ?? '').toLowerCase().includes(query)
      )
      .reverse();
  });

  selected = signal<SponsorM | null>(null);
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
    eTitle: '',
    eDesc: '',
    companyID: environment.companyCode,
    eImageFile: '',
    eImageUrl: '',
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.eTitle, { message: 'Title is required' });

    // Debounce form updates for better performance
    debounce(schemaPath.eTitle, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadSponsors();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Sponsor', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Sponsor', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Sponsor', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Sponsor', 'delete'));
  }

  loadSponsors(eTitle = "", eDesc = "", companyID = environment.companyCode) {
    this.isLoading.set(true);
    this.hasError.set(false);
    const searchParams = { companyID, eTitle, eDesc }

    this.sponsorService.search(searchParams).subscribe({
      next: (data) => {
        this.sponsors.set(data);
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
      const input = document.getElementById('eImageUrl') as HTMLInputElement;
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
    formData.append('ETitle', formValue.eTitle);
    formData.append('EDesc', formValue.eDesc ?? '');
    formData.append('EImageUrl', formValue.eImageUrl ?? '');
    // ✅ Append file correctly
    if (this.selectedFile()) {
      formData.append('EImageFile', this.selectedFile() as File);
    }


    const request$ = this.selected()
      ? this.sponsorService.update(this.selected()!.id, formData)
      : this.sponsorService.add(formData);

    request$.subscribe({
      next: () => {
        this.loadSponsors();
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
  onUpdate(sponsor: SponsorM) {
    this.selected.set(sponsor);

    this.model.update(current => ({
      ...current,
      eTitle: sponsor?.eTitle,
      eDesc: sponsor?.eDesc ?? '',
      companyID: sponsor?.companyID,
      eImageUrl: sponsor?.eImageUrl,
    }));

    this.form().reset();
    // Set main image preview
    if (sponsor.eImageUrl) {
      this.previewUrl.set(
        this.imgURL ? `${this.imgURL}${sponsor.eImageUrl}` : sponsor.eImageUrl
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
      message: 'Are you sure you want to delete this sponsor?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete sponsor
      this.sponsorService.delete(id).subscribe({
        next: () => {
          this.sponsors.update(list => list.filter(c => c.id !== id));
          this.toast.success('sponsor deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('sponsor deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting sponsor:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      eTitle: '',
      eDesc: '',
      companyID: environment.companyCode,
      eImageFile: '',
      eImageUrl: '',
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
