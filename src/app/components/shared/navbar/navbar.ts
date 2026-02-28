import { Component, computed, inject, signal, OnInit, OnDestroy, ElementRef, viewChild } from '@angular/core';
import { RouterLink, NavigationEnd, Router } from "@angular/router";
import { filter, Subscription, firstValueFrom } from 'rxjs';
import { FlowbiteS } from '../../../services/flowbite';
import { ItemS } from '../../../services/item-s';
import { ItemM, ProductM } from '../../../utils/models';
import { environment } from '../../../../environments/environment';
import { ProductS } from '../../../services/product-s';
import { CommonModule, IMAGE_LOADER, ImageLoaderConfig, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, NgOptimizedImage],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  flowbiteService = inject(FlowbiteS);
  private itemService = inject(ItemS);
  private productService = inject(ProductS);
  private router = inject(Router);
  
  items = signal<ItemM[]>([]);
  products = signal<ProductM[]>([]);
  searchQuery = signal<string>("");
  ImageApi = environment.ImageApi;
  companyName = environment.companyName;
  private routerSubscription!: Subscription;
  readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  // Mobile menu state
  isMobileMenuOpen = signal(false);
  isMobileSearchOpen = signal(false);
  
  // Mobile submenu state
  mobileSubmenuOpen = signal<number | null>(null);

  // Use computed signal for dynamic menus
  menus = computed(() => {
    const dropdownData = this.items().map(item => ({
      name: item.description,
      link: this.generateProductLink(Number(item.id), item.description),
    }));

    return [
      { name: 'Home', link: '/' },
      { 
        name: 'Products', 
        submenu: dropdownData.length > 0 ? dropdownData : [],
        hasDropdown: true
      },
      { name: 'About', link: '/about' },
      { name: 'Contact', link: '/contact' },
    ];
  });

  searchResults = computed(() => {
    const query = this.searchQuery().toLowerCase();
    
    if (!query || query.length < 2) return [];

    return this.products().filter(product => 
      product.title?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.brand?.toLowerCase().includes(query) ||
      product.model?.toLowerCase().includes(query)
    ).slice(0, 8);
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadItems();
    this.flowbiteService.loadFlowbite((flowbite) => {
      flowbite.initFlowbite();
    });

    // Subscribe to router events to close dropdowns on navigation
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // IMPORTANT: Reload products from cache on route change
        this.loadProducts();
        this.closeAllDropdowns();
        this.closeMobileMenu();
        this.closeMobileSearch();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  closeAllDropdowns(): void {
    // Close all Flowbite dropdowns when navigating
    const dropdowns = document.querySelectorAll('[data-dropdown-toggle]');
    dropdowns.forEach(dropdown => {
      const targetId = dropdown.getAttribute('data-dropdown-toggle');
      if (targetId) {
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.classList.add('hidden');
        }
      }
    });
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    this.mobileSubmenuOpen.set(null);
  }

  closeMobileSearch(): void {
    this.isMobileSearchOpen.set(false);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(state => !state);
    this.closeMobileSearch();
    // Reset submenu when closing/opening main menu
    if (!this.isMobileMenuOpen()) {
      this.mobileSubmenuOpen.set(null);
    }
  }

  toggleMobileSearch(): void {
    this.isMobileSearchOpen.update(state => !state);
    this.closeMobileMenu();
  }

  toggleMobileSubmenu(index: number): void {
    this.mobileSubmenuOpen.update(current => {
      return current === index ? null : index;
    });
  }

  isMobileSubmenuOpen(index: number): boolean {
    return this.mobileSubmenuOpen() === index;
  }

  onMenuClick(menu: any): void {
    if (!menu.submenu) {
      // For regular links, close all dropdowns and mobile menu
      this.closeAllDropdowns();
      this.closeMobileMenu();
      this.closeMobileSearch();
      this.onClearSearch();
    } else {
      // For dropdown menus, just close mobile menu on mobile
      if (window.innerWidth < 768) {
        this.closeMobileMenu();
      }
    }
  }

  onSearchClick(): void {
    // Close mobile menu when searching on mobile
    if (window.innerWidth < 768) {
      this.closeMobileMenu();
    }
  }

  loadItems(companyID = environment.companyCode) {
    this.itemService.search({ companyID }).subscribe({
      next: (data) => {
        this.items.set(data);
      },
      error: (error) => {
        console.error('Error loading items:', error);
      }
    });
  }

  // UPDATED: Use async/await to properly handle the cached observable
  async loadProducts() {
    try {
      const params = { companyID: environment.companyCode };
      // Convert the cached observable to a promise
      const products = await firstValueFrom(
        this.productService.search(params)
      );
      this.products.set(products.slice(0, 8));
    } catch (error) {
      console.error('Error loading products:', error);
      this.products.set([]);
    }
  }

  /* ---------------- SEARCH ---------------- */
  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value.trim());
  }

  onClearSearch(): void {
    this.searchQuery.set("");
    this.closeMobileSearch();
    // Don't clear products array - keep the cached products
  }

  private generateProductLink(itemId: number, description: string | null | undefined): string {
    const slug = (description ?? '')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    
    return `/products/${itemId}/${slug}`;
  }
}