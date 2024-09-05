// auth.interceptor.ts

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';  // Импортируем AuthService, чтобы получить текущий токен
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

	constructor(private authService: AuthService) { }

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const authToken = this.authService.getToken();
		const tokenExpiry = localStorage.getItem('tokenExpiry');

		if (authToken && tokenExpiry && Date.now() < Number(tokenExpiry)) {
			const cloned = req.clone({
				headers: req.headers.set('Authorization', `Bearer ${authToken}`)
			});
			return next.handle(cloned).pipe(
				catchError(error => {
					if (error.status === 401) {
						this.authService.logout();
						window.location.href = '/login';
					}
					return throwError(error);
				})
			);
		} else {
			// Если токен истек или отсутствует, делаем logout и перенаправляем на страницу входа
			this.authService.logout().subscribe(() => {
				window.location.href = '/login'; // Перенаправляем на страницу входа
			});
			// Вы можете также бросить ошибку или предотвращать выполнение запроса, если нужно
			return throwError(() => new Error('Пользователь не аутентифицирован или токен истек.'));
		}
	}
}
