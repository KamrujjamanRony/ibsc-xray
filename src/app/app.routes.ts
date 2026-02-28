import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth-guard';
import { environment } from '../environments/environment';

const companyName = environment.companyName;

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main/main').then(m => m.Main),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./components/home/home').then(m => m.Home),
        data: {
          title: `Home | ${companyName}`,
          description: 'Best products at best price',
          keywords: 'shop, ecommerce, products',
          loc: '/',
          lastmod: '2026-01-12',
          changefreq: 'daily',
          priority: '1.0',
          schema: {
            '@type': 'WebSite',
            name: companyName,
            url: environment.webUrl
          }
        }
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./components/products/products').then(m => m.Products),
          title: `Products | ${companyName}`,
      },
      {
        path: 'products/:itemId/:itemSlug',
        loadComponent: () =>
          import('./components/products/products').then(m => m.Products),
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import('./components/product-view/product-view').then(m => m.ProductView)
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./components/about/about').then(m => m.About),
        data: {
          seo: {
            title: 'About Us',
            description: 'Learn more about our company, mission, and values',
            type: 'website'
          }
        }
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./components/contact/contact').then(m => m.Contact),
        data: {
          seo: {
            title: 'Contact Us - Get in Touch',
            description: 'Get in touch with us for any inquiries or support. We are here to help you with your needs.',
            type: 'website'
          }
        }
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () => import('./layouts/admin/admin').then(m => m.Admin),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'carousel', pathMatch: 'full' },
      {
        path: 'carousel',
        loadComponent: () =>
          import('./components/admin/carousel-list/carousel-list').then(m => m.CarouselList),
        title: `Carousel Management | ${companyName}`,
      },
      {
        path: 'item',
        loadComponent: () =>
          import('./components/admin/item-list/item-list').then(m => m.ItemList),
        title: `Item Management | ${companyName}`,
      },
      {
        path: 'product',
        loadComponent: () =>
          import('./components/admin/product-list/product-list').then(m => m.ProductList),
        title: `Product Management | ${companyName}`,
      },
      {
        path: 'user',
        loadComponent: () =>
          import('./components/admin/users/users.component').then(m => m.UsersComponent),
        title: `User Management | ${companyName}`,
      },
      {
        path: 'menu',
        loadComponent: () =>
          import('./components/admin/menu-list/menu-list.component').then(m => m.MenuListComponent),
        title: `Menu Management | ${companyName}`,
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./components/admin/about-update/about-update').then(m => m.AboutUpdate),
        title: `About Us Update | ${companyName}`,
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./components/admin/contact-update/contact-update').then(m => m.ContactUpdate),
        title: `Contact Us Update | ${companyName}`,
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/admin/login/login').then(m => m.Login),
        title: `Login Page | ${companyName}`,
  }
];
