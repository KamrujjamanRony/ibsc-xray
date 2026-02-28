import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthS } from './auth-s';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    if (isPlatformBrowser(platformId)) {
        const auth = inject(AuthS);
        const router = inject(Router);
        const userInfo = auth.getUser();

        // Add Authorization header if token exists
        if (userInfo?.token) {
            req = req.clone({
                setHeaders: { Authorization: `Bearer ${userInfo.token}` }
            });
        }

        // Handle the response and check for 401 errors
        return next(req).pipe(
            catchError((error: HttpErrorResponse) => {
                if (error.status === 401) {
                    // Clear user data and navigate to login
                    auth.deleteUser();
                    router.navigate(['/login']);
                }
                return throwError(() => error);
            })
        );
    }
    return next(req);
};
