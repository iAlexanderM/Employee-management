import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
	const authService = inject(AuthService);
	const authToken = authService.getToken();
	const tokenExpiry = localStorage.getItem('tokenExpiry');

	if (authToken && tokenExpiry && Date.now() < Number(tokenExpiry)) {
		const cloned = req.clone({
			setHeaders: {
				Authorization: `Bearer ${authToken}`
			}
		});
		return next(cloned); // Продолжаем обработку запроса
	}

	return next(req).pipe(
		catchError(error => {
			if (error.status === 401) {
				authService.logout().subscribe(() => {
					window.location.href = '/login';
				});
			}
			return throwError(() => new Error('Ошибка запроса: ' + error.message));
		})
	);
};
