// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer, Subscription } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private apiUrl = '/api/auth'; // Относительный путь
	private inactivityTimeout: any;
	private tokenExpiryCheckTimer: Subscription | null = null;
	private readonly maxInactivityDuration = 30 * 60 * 1000; // 30 минут
	private readonly refreshThreshold = 10 * 60 * 1000; // 10 минут

	constructor(
		private http: HttpClient,
		private tokenService: TokenService,
		private router: Router
	) { }

	initializeToken(): Observable<boolean> {
		const token = this.tokenService.getToken();
		const tokenExpiry = this.tokenService.getTokenExpiry();

		if (token && tokenExpiry && Date.now() < tokenExpiry) {
			console.log(`Токен активен. Истекает: ${new Date(tokenExpiry).toLocaleString()}`);
			this.startInactivityTimer();
			this.startTokenExpiryCheck();
			return of(true);
		}

		if (this.tokenService.getRefreshToken()) {
			console.log('Токен истёк. Попытка обновления.');
			return this.refreshToken();
		}

		console.warn('Нет токена или refresh токена. Пользователь не авторизован.');
		this.logout();
		return of(false);
	}

	login(username: string, password: string): Observable<boolean> {
		return this.http
			.post<{ accessToken: string; refreshToken: string }>(`${this.apiUrl}/login`, { username, password })
			.pipe(
				map(response => {
					if (response?.accessToken) {
						// Устанавливаем время истечения токена (например, 30 минут)
						const tokenExpiry = Date.now() + 30 * 60 * 1000;
						this.tokenService.saveTokens(response.accessToken, response.refreshToken, tokenExpiry);
						this.startInactivityTimer();
						this.startTokenExpiryCheck();
						console.log('Вход выполнен успешно. Токены сохранены.');
						return true;
					}
					console.warn('Ответ сервера не содержит accessToken.');
					return false;
				}),
				catchError(error => {
					console.error('Ошибка при логине', error);
					return of(false);
				})
			);
	}

	logout(): void {
		this.tokenService.clearTokens();
		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
		}
		this.stopTokenExpiryCheck();
		this.router.navigate(['/login']);
		console.log('Выход из системы выполнен. Пользователь перенаправлен на страницу логина.');
	}

	isAuthenticated(): boolean {
		const token = this.tokenService.getToken();
		const tokenExpiry = this.tokenService.getTokenExpiry();
		const isAuthenticated = !!(token && tokenExpiry && Date.now() < tokenExpiry);
		return isAuthenticated;
	}

	refreshToken(): Observable<boolean> {
		const refreshToken = this.tokenService.getRefreshToken();

		if (!refreshToken) {
			console.error('Refresh токен отсутствует. Выполняется logout.');
			this.logout();
			return of(false);
		}

		console.log('Попытка обновления токена...');
		return this.http
			.post<{ accessToken: string; refreshToken: string }>(`${this.apiUrl}/refresh`, { refreshToken })
			.pipe(
				tap(response => {
					if (response?.accessToken) {
						// Устанавливаем новое время истечения токена (например, 30 минут)
						const newTokenExpiry = Date.now() + 30 * 60 * 1000;
						this.tokenService.saveTokens(response.accessToken, response.refreshToken, newTokenExpiry);
						this.startInactivityTimer();
						this.startTokenExpiryCheck();
						console.log('Токен успешно обновлён.');
					} else {
						console.warn('Ответ сервера не содержит accessToken при обновлении.');
						this.logout();
					}
				}),
				map(response => {
					if (response && response.accessToken) {
						return true;
					}
					return false;
				}),
				catchError(error => {
					console.error('Ошибка при обновлении токена', error);
					this.logout();
					return of(false);
				})
			);
	}

	getToken(): string | null {
		return this.tokenService.getToken();
	}

	resetInactivityTimer(): void {
		this.startInactivityTimer();
	}

	private startInactivityTimer(): void {
		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
		}

		this.inactivityTimeout = setTimeout(() => {
			console.warn('Таймер бездействия истёк. Выполняется logout.');
			this.logout();
		}, this.maxInactivityDuration);

		console.log(`Таймер бездействия запущен на ${this.maxInactivityDuration / 1000 / 60} минут.`);
	}

	private startTokenExpiryCheck(): void {
		// Останавливаем предыдущий таймер, если он есть
		this.stopTokenExpiryCheck();

		const tokenExpiry = this.tokenService.getTokenExpiry();
		if (!tokenExpiry) return;

		// Интервал проверки устанавливаем больше или равно refreshThreshold
		const interval = Math.max(this.refreshThreshold, 10 * 1000); // Проверяем каждые 10 секунд

		console.log(`Запуск проверки истечения токена с интервалом: ${interval / 1000} секунд.`);

		// Запускаем таймер
		this.tokenExpiryCheckTimer = timer(0, interval).subscribe(() => {
			const currentTokenExpiry = this.tokenService.getTokenExpiry();
			if (!currentTokenExpiry) {
				console.warn('Отсутствует время истечения токена. Выполняется logout.');
				this.logout();
				return;
			}

			const timeRemaining = currentTokenExpiry - Date.now();

			if (timeRemaining < this.refreshThreshold && timeRemaining > 0) {
				console.log('Токен скоро истечёт. Выполняется обновление токена.');
				this.refreshToken().subscribe(success => {
					if (!success) {
						console.warn('Не удалось обновить токен. Выполняется logout.');
						this.logout();
					}
				});
			} else if (timeRemaining <= 0) {
				console.warn('Токен истёк. Выполняется logout.');
				this.logout();
			} else {
				const remainingMinutes = Math.floor(timeRemaining / 1000 / 60);
				console.log(`Токен ещё действителен. Осталось: ${remainingMinutes} минут.`);
			}
		});
	}

	private stopTokenExpiryCheck(): void {
		if (this.tokenExpiryCheckTimer) {
			this.tokenExpiryCheckTimer.unsubscribe();
			this.tokenExpiryCheckTimer = null;
			console.log('Проверка истечения токена остановлена.');
		}
	}
}
