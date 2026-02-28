import { HttpInterceptorFn } from '@angular/common/http';

export const appOriginInterceptor: HttpInterceptorFn = (req, next) => {
  
  // Only add header to API requests, not to external URLs or assets
  const isApiRequest = req.url.startsWith('/api/') || 
                       req.url.includes('localhost') ||
                       req.url.includes('your-domain.com');
  
  if (isApiRequest) {
    const clonedRequest = req.clone({
      setHeaders: {
        'x-app-origin': 'supersoftbd-client'
      }
    });
    return next(clonedRequest);
  }
  
  return next(req);
};
