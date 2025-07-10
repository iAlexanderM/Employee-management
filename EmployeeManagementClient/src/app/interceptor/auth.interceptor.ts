import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
	req: HttpRequest<any>,
	next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
	const tokenService = inject(TokenService);
	const authService = inject(AuthService);

	const accessToken = tokenService.getAccessToken();
	const clonedRequest = accessToken
		? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
		: req;

	return next(clonedRequest).pipe(
		catchError(error => {
			if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/auth/logout')) {
				console.error('Ошибка авторизации. Выполняется logout.');
				authService.logout();
			}
			return throwError(() => error);
		})
	);
};