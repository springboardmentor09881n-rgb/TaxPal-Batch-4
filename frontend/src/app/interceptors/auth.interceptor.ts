import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let token = sessionStorage.getItem('tp_token');
  
  if (!token) {
    const activeUserStr = sessionStorage.getItem('tp_active_user');
    if (activeUserStr) {
      try {
        const activeUser = JSON.parse(activeUserStr);
        token = activeUser.token;
        if (token) {
          sessionStorage.setItem('tp_token', token);
        }
      } catch {}
    }
  }

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }
  return next(req);
};
