import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private apiUrl = 'http://localhost:8080/api/auth';
	private isAuthenticatedFlag = false;
	private tokenKey = 'authToken';
	private tokenExpiryKey = 'tokenExpiry';
	private token: string | null = null;

	constructor(private http: HttpClient) {
		const token = localStorage.getItem(this.tokenKey);
		const tokenExpiry = localStorage.getItem(this.tokenExpiryKey);

		if (token && tokenExpiry && Date.now() < Number(tokenExpiry)) {
			this.token = token;
			this.isAuthenticatedFlag = true;
		} else {
			this.logout();
		}
	}

	// Метод логина, возвращающий Observable<boolean>
	login(username: string, password: string): Observable<boolean> {
		return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password }).pipe(
			map(response => {
				console.log('Login response:', response);

				if (response && response.token) {
					this.isAuthenticatedFlag = true;
					this.token = response.token;
					localStorage.setItem(this.tokenKey, response.token); // Сохраняем токен в localStorage

					const tokenExpiry = Date.now() + 30 * 60 * 1000; // Токен действует 30 минут
					localStorage.setItem(this.tokenExpiryKey, tokenExpiry.toString());

					console.log('Token saved in localStorage:', response.token); // Лог токена
					console.log('Token expiry at:', new Date(tokenExpiry).toLocaleString()); // Лог времени истечения

					// Возвращаем true, если токен был успешно получен
					return true;
				} else {
					console.error('No token in response');
					return false; // Возвращаем false, если токен отсутствует
				}
			}),
			catchError(error => {
				console.error('Ошибка при логине', error);
				return of(false); // Возвращаем false в случае ошибки
			})
		);
	}

	// Метод логаута
	logout(): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
			tap(() => {
				this.isAuthenticatedFlag = false;
				this.token = null;
				localStorage.removeItem(this.tokenKey);
				localStorage.removeItem(this.tokenExpiryKey);
			}),
			catchError(error => {
				console.error('Ошибка при выходе', error);
				return of(); // Возвращаем пустое значение в случае ошибки
			})
		);
	}

	// Проверка аутентификации
	isAuthenticated(): boolean {
		const token = localStorage.getItem(this.tokenKey);
		const tokenExpiry = localStorage.getItem(this.tokenExpiryKey);

		if (token && tokenExpiry && Date.now() < Number(tokenExpiry)) {
			return true;
		}
		return false;
	}

	// Получение токена
	getToken(): string | null {
		return this.token;
	}
}
