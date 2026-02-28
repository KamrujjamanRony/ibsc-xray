import { Component, ElementRef, inject, signal, computed, viewChild, viewChildren, OnInit } from '@angular/core';
import { FormField, form, required, validate, debounce } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPencil, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { MultiSelect } from '../../shared/multi-select/multi-select';
import { MenuM } from '../../../utils/models';
import { PermissionS } from '../../../services/auth/permission-s';
import { ToastService } from '../../../utils/toast/toast.service';
import { ConfirmService } from '../../../utils/confirm/confirm.service';
import { PermissionOptionM } from '../../../models/User';
import { MenuS } from '../../../services/auth/menu-s';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [FontAwesomeModule, FormField, FormsModule, MultiSelect],
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.css'
})
export class MenuListComponent implements OnInit {
  faPencil = faPencil;
  faXmark = faXmark;
  faMagnifyingGlass = faMagnifyingGlass;

  /* ---------------- DI ---------------- */
  private menuService = inject(MenuS);
  private permissionService = inject(PermissionS);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  /* ---------------- SIGNAL STATE ---------------- */
  menus = signal<MenuM[]>([]);
  searchQuery = signal('');
  permissionsKey: PermissionOptionM[] = []; // Change to PermissionOption array

  filteredMenuList = computed(() => {
    const query = this.searchQuery().toLowerCase();

    return this.menus()
      .filter(menu =>
        menu.menuName?.toLowerCase().includes(query) ||
        menu.url?.toLowerCase().includes(query) ||
        menu.icon?.toLowerCase().includes(query)
      )
      .reverse();
  });

  menuOptions = computed(() =>
    this.menus().map(menu => ({
      key: menu.id,
      value: menu.menuName
    }))
  );

  selected = signal<MenuM | null>(null);

  isLoading = signal(false);
  hasError = signal(false);
  isSubmitted = signal(false);

  isView = signal(false);
  isInsert = signal(false);
  isEdit = signal(false);
  isDelete = signal(false);
  showList = signal(true);

  // Define permission options as array of objects
  permissionOptions: PermissionOptionM[] = [
    { key: 'view', value: 'View' },
    { key: 'create', value: 'Create' },
    { key: 'edit', value: 'Edit' },
    { key: 'delete', value: 'Delete' },
  ];

  /* ---------------- FORM MODEL ---------------- */
  model = signal({
    menuName: '',
    parentMenuId: '',
    url: '',
    isActive: 'true',
    icon: '',
    permissionsKey: [] as string[], // Keep as string[] for form
    postBy: ''
  });

  /* ---------------- SIGNAL FORM ---------------- */
  form = form(this.model, (schemaPath) => {
    required(schemaPath.menuName, { message: 'Menu Name is required' });
    required(schemaPath.url, { message: 'Menu URL is required' });
    validate(schemaPath.url, ({ value }) => {
      if (!value().startsWith('/')) {
        return {
          kind: 'https',
          message: 'URL must start with / symbol'
        }
      }
      return null
    })

    debounce(schemaPath.menuName, 300);
    debounce(schemaPath.url, 300);
  });

  /* ---------------- LIFECYCLE ---------------- */
  ngOnInit(): void {
    this.loadMenus();
    this.loadPermissions();
  }

  /* ---------------- LOADERS ---------------- */
  loadPermissions() {
    this.isView.set(this.permissionService.hasPermission('Menu'));
    this.isInsert.set(this.permissionService.hasPermission('Menu', 'create'));
    this.isEdit.set(this.permissionService.hasPermission('Menu', 'edit'));
    this.isDelete.set(this.permissionService.hasPermission('Menu', 'delete'));
  }

  loadMenus() {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.menuService.search().subscribe({
      next: data => {
        this.menus.set((data as MenuM[]) ?? []);
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
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  /* ---------------- FORM HELPERS ---------------- */
  getParentMenuName(menuId: any): string {
    return this.menuOptions().find(m => m.key === menuId)?.value ?? '';
  }

  // Convert PermissionOption[] to string[] (just keys)
  getPermissionKeys(permissions: PermissionOptionM[]): string[] {
    return permissions.map(p => p.key);
  }

  /* ---------------- SUBMIT ---------------- */
  onSubmit(event: Event) {
    event.preventDefault();

    if (!this.form().valid()) {
      this.toast.warning('Form is Invalid!', 'bottom-right', 5000);
      return;
    }
    const formValue = this.form().value();
    this.isSubmitted.set(true);

    const payload = {
      menuName: formValue.menuName,
      parentMenuId: formValue.parentMenuId ? Number(formValue.parentMenuId) : null,
      url: formValue.url,
      isActive: formValue.isActive === 'true',
      icon: formValue.icon,
      permissionsKey: this.getPermissionKeys(this.permissionsKey), // Convert to string[]
      postBy: formValue.postBy
    };

    const request$ = this.selected()
      ? this.menuService.update(this.selected()!.id, payload)
      : this.menuService.add(payload);

    request$.subscribe({
      next: () => {
        this.loadMenus();
        this.onToggleList();
        this.toast.success('Saved successfully!', 'bottom-right', 5000);
      },
      error: (error) => {
        this.toast.danger('Saved unsuccessful!', 'bottom-left', 3000);
        console.error('Error submitting form:', error);
        this.isSubmitted.set(false);
      }
    });
  }

  /* ---------------- UPDATE ---------------- */
  onUpdate(menu: MenuM) {
    this.selected.set(menu);

    // Convert string[] to PermissionOption[]
    if (menu.permissionsKey) {
      this.permissionsKey = this.permissionOptions.filter(option =>
        menu.permissionsKey!.includes(option.key)
      );
    } else {
      this.permissionsKey = [];
    }

    // Update the form model
    this.model.update(current => ({
      ...current,
      menuName: menu.menuName,
      parentMenuId: menu.parentMenuId ?? '',
      url: menu.url ?? '',
      isActive: menu.isActive ? 'true' : 'false',
      icon: menu.icon ?? '',
      permissionsKey: menu.permissionsKey ?? []
    }));
    this.showList.set(false);

    // Reset validation states
    this.form().reset();
  }

  /* ---------------- DELETE ---------------- */
  async onDelete(id: any) {
    const ok = await this.confirm.confirm({
      message: 'Are you sure you want to delete this Menu?',
      confirmText: "Yes, I'm sure",
      cancelText: 'No, cancel',
      variant: 'danger',
    });

    if (ok) {
      // Delete Menu
      this.menuService.delete(id).subscribe({
        next: () => {
          this.menus.update(list => list.filter(i => i.id !== id));
          this.toast.success('Menu deleted successfully!', 'bottom-right', 5000);
        },
        error: (error) => {
        this.toast.danger('Menu deleted unsuccessful!', 'bottom-left', 3000);
          console.error('Error deleting Menu:', error);
        }
      });
    }
  }

  /* ---------------- RESET ---------------- */
  formReset() {
    // Reset the model
    this.model.set({
      menuName: '',
      parentMenuId: '',
      url: '',
      isActive: 'true',
      icon: '',
      permissionsKey: [],
      postBy: '',
    });

    // Reset permissions
    this.permissionsKey = [];
    this.selected.set(null);
    this.isSubmitted.set(false);
    this.form().reset();
  }

  onToggleList() {
    this.showList.update(s => !s);
    this.formReset();
  }
}