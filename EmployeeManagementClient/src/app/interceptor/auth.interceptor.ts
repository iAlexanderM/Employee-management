import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';  // Импортируем AuthService, чтобы получить текущий токен

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

	constructor(private authService: AuthService) { }  // Внедряем AuthService

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const authToken = this.authService.getToken(); // Получение токена из AuthService
		const tokenExpiry = localStorage.getItem('tokenExpiry');

		if (authToken && tokenExpiry && Date.now() < Number(tokenExpiry)) { // Проверяем, истек ли срок действия токена
			const cloned = req.clone({
				headers: req.headers.set('Authorization', `Bearer ${authToken}`)  // исправлено добавление заголовка
			});
			return next.handle(cloned);
		} else {
			// Если токен истек или отсутствует, делаем logout и перенаправляем на страницу входа
			this.authService.logout().subscribe(() => {
				window.location.href = '/login'; // Перенаправляем на страницу входа
			});
			return next.handle(req); // Также можно вернуть пустое значение или Observable.throw(...) чтобы предотвратить выполнение запроса
		}
	}
}
