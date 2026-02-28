import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthS } from './auth-s';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthS);
  const router: Router = inject(Router);
  const userInfo = auth.getUser();
  if (userInfo) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
