import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';  // Импортируем AuthService, чтобы получить текущий токен

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

	constructor(private authService: AuthService) { }  // Внедряем AuthService

	intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		const authToken = this.authService.getToken(); // Получаем токен через сервис аутентификации
		const cloned = req.clone({
			headers: req.headers.set('Authorization', `Bearer ${authToken}`)
		});

		return next.handle(cloned);
	}
}
