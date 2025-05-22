import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ApplicationUser } from '../models/application-user.model';
import { AuthService } from './auth.service'; // Импортируем AuthService

@Injectable({
	providedIn: 'root'
})
export class UserService {
	private apiUrl = 'http://localhost:8080/api/users';
	private currentUserUrl = `${this.apiUrl}/current`;

	constructor(
		private http: HttpClient,
		private authService: AuthService // Внедряем AuthService
	) { }

	private getAuthHeaders(): HttpHeaders {
		const token = this.authService.getToken(); // Используем AuthService
		return new HttpHeaders({
			Authorization: token ? `Bearer ${token}` : '',
			'Content-Type': 'application/json'
		});
	}

	getToken(): string | null {
		const token = this.authService.getToken(); // Используем AuthService
		console.debug('Получение токена в UserService:', token ? token.substring(0, 50) + '...' : 'Токен отсутствует');
		return token;
	}

	getAllUsers(): Observable<ApplicationUser[]> {
		return this.http.get<ApplicationUser[]>(this.apiUrl, { headers: this.getAuthHeaders() })
			.pipe(
				tap(users => console.debug('Загружены пользователи:', users)),
				catchError(err => {
					console.error('Ошибка при загрузке пользователей:', err);
					return throwError(() => new Error('Не удалось загрузить данные пользователей'));
				})
			);
	}

	getCurrentUser(): ApplicationUser | null {
		const token = this.authService.getToken();
		if (!token) {
			console.warn('Токен отсутствует (UserService via AuthService)');
			return null;
		}
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			console.debug('Payload токена:', payload);
			const exp = payload.exp;
			const expDate = new Date(exp * 1000);
			console.debug('expDate:', expDate.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }));
			if (exp && Date.now() >= exp * 1000) {
				console.warn('Токен истёк, exp:', expDate.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }));
				// Попытка обновления токена через AuthService
				this.authService.refreshToken().subscribe({
					next: (success) => {
						if (success) {
							console.debug('Токен обновлён, повторная попытка получения пользователя');
							return this.getCurrentUser(); // Рекурсивный вызов после обновления
						} else {
							console.warn('Не удалось обновить токен');
							return null;
						}
					},
					error: () => {
						console.warn('Ошибка при обновлении токена');
						return null;
					}
				});
				return null; // Возвращаем null, пока токен обновляется
			}
			const userName = payload.sub || payload.name || payload.username || payload.email || null;
			const userId = payload.userId || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
			if (!userName) {
				console.warn('Имя пользователя (sub, name, username, email) отсутствует в токене', payload);
				return null;
			}
			console.debug('Извлечён пользователь:', { id: userId, userName });
			return {
				id: userId,
				userName: userName
			} as ApplicationUser;
		} catch (e) {
			console.error('Ошибка при декодировании токена:', e);
			return null;
		}
	}
}

