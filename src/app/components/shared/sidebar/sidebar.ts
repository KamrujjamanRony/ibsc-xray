import { Component, inject, signal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faImage, faXRay, faUser, faRectangleList, faAddressCard, faAddressBook, faRightFromBracket, faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { AuthS } from '../../../services/auth/auth-s';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, FontAwesomeModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  faCaretDown = faCaretDown;
  faCaretUp = faCaretUp;
  faImage = faImage;
  faXRay = faXRay;
  faUser = faUser;
  faRectangleList = faRectangleList;
  faAddressCard = faAddressCard;
  faAddressBook = faAddressBook;
  faRightFromBracket = faRightFromBracket;
  auth = inject(AuthS);



  sidebarData = signal<any[]>([
    {
      id: 0, label: 'Carousel', icon: faImage, route: '/admin/carousel'
    },
    {
      id: 1, label: 'Product', icon: faXRay, route: '/admin/product'
    },
    {
      id: 2, label: 'Item', icon: faXRay, route: '/admin/item'
    },
    {
      id: 3, label: 'User', icon: faUser, route: '/admin/user'
    },
    {
      id: 4, label: 'Menu', icon: faRectangleList, route: '/admin/menu'
    },
    {
      id: 5, label: 'About', icon: faAddressCard, route: '/admin/about'
    },
    {
      id: 6, label: 'Contact', icon: faAddressBook, route: '/admin/contact'
    }
  ]);

  menuState = signal<Record<number, boolean>>({});

  toggleMenu(itemId: number) {
    this.menuState.update(state => ({
      ...state,
      [itemId]: !state[itemId]
    }));
  }

  sidebarHovered = signal<boolean>(false);

  setSidebarHover(state: boolean) {
    this.sidebarHovered.set(state);

    // Close all submenus when hovering out
    if (!state) {
      this.menuState.set({});
    }
  }
}
