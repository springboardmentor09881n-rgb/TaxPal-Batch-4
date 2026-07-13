import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionUser = sessionStorage.getItem('tp_active_user');
  if (sessionUser) {
    try {
      const user = JSON.parse(sessionUser);
      if (user && user.token) {
        const clonedRequest = req.clone({
          setHeaders: {
            Authorization: `Bearer ${user.token}`
          }
        });
        return next(clonedRequest);
      }
    } catch (e) {
      // Ignore parse error
    }
  }
  return next(req);
};
