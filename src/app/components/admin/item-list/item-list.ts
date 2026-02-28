import { Component, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemM } from '../../../utils/models';
import { environment } from '../../../../environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { ItemS } from '../../../services/item-s';
import { PermissionS } from '../../../services/auth/permission-s';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';

@Component({
  selector: 'app-item-list',
  imports: [CommonModule, FontAwesomeModule, FormField, FormsModule],
  templateUrl: './item-list.html',
  styleUrl: './item-list.css',
})
export class ItemList {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;
  
  /* ---------------- DI ---------------- */
  private itemService = inject(ItemS);
  private permissionService = inject(PermissionS);
      private toast = inject(ToastService);
      private confirm = inject(ConfirmService);
  
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /* ---------------- SIGNAL STATE ---------------- */
  items = signal<ItemM[]>([]);
  searchQuery = signal('');

  filteredList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.items()
      .filter(item =>
        String(item.id ?? '').toLowerCase().includes(query) ||
        String(item.slItem ?? '').toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
      .sort((a, b) => (a.slItem! - b.slItem!));
  });

  selected = signal<ItemM | null>(null);

  isLoading = signal(false);
  hasError = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  isSubmitted = signal(false);

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    description: '',
    slItem: '',
    companyID: environment.companyCode.toString(),
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.description, { message: 'Description is required' });
    validate(schemaPath.slItem, ({ value }) => {
      if (value() && !/^\d+$/.test(value())) {
        return {
          kind: 'complexity',
          message: 'SL Item must be a valid number'
        }
      }
      return null;
    })

    debounce(schemaPath.description, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadItems();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Item', 'view'));
    this.isInsert.set(this.permissionService.hasPermission('Item', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Item', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Item', 'delete'));
  }

  loadItems() {
    this.isLoading.set(true);
    this.hasError.set(false);
    
    const params = { 
      companyID: environment.companyCode 
    };

    this.itemService.search(params).subscribe({
      next: (data) => {
        this.items.set(data);
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

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }

    this.isSubmitted.set(true);

    const formValue = this.form().value();

    const payload = {
      companyID: Number(formValue.companyID),
      description: formValue.description,
      slItem: formValue.slItem ? Number(formValue.slItem) : null,
    };
    
    const request$ = this.selected()
      ? this.itemService.update(this.selected()!.id!, payload)
      : this.itemService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadItems();
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
  onUpdate(item: ItemM) {
    this.selected.set(item);

    // Update form model
    this.model.update(current => ({
      ...current,
      description: item.description ?? '',
      slItem: item.slItem?.toString() ?? '',
      companyID: item.companyID.toString(),
    }));

    this.form().reset();
    this.showList.set(false);
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this item?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete item
      this.itemService.delete(id).subscribe({
        next: () => {
          this.items.update(list => list.filter(i => i.id !== id));
          this.toast.success('item deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
          this.toast.danger('item deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting item:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    this.model.set({
      description: '',
      slItem: '',
      companyID: environment.companyCode.toString(),
    });

    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }

}
