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
	private apiUrl = 'http://localhost:8080/api/auth';
	private inactivityTimeout: any;
	private tokenExpiryCheckTimer: Subscription | null = null;
	private readonly maxInactivityDuration = 30 * 60 * 1000;
	private readonly refreshThreshold = 10 * 60 * 1000;

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
						this.tokenService.saveTokens(response.accessToken, response.refreshToken, 30 * 60 * 1000);
						this.startInactivityTimer();
						this.startTokenExpiryCheck();
						return true;
					}
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
		clearTimeout(this.inactivityTimeout);
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
						this.tokenService.saveTokens(response.accessToken, response.refreshToken, 30 * 1000);
						console.log('Токен успешно обновлён.');
					}
				}),
				catchError(error => {
					console.error('Ошибка при обновлении токена', error);
					this.logout();
					return of(false);
				}),
				map(() => true)
			);
	}

	resetInactivityTimer(): void {
		this.startInactivityTimer();
	}

	private startInactivityTimer(): void {
		clearTimeout(this.inactivityTimeout);

		this.inactivityTimeout = setTimeout(() => {
			console.warn('Таймер бездействия истёк. Выполняется logout.');
			this.logout();
		}, this.maxInactivityDuration);
	}

	private startTokenExpiryCheck(): void {
		// Останавливаем предыдущий таймер, если он есть
		this.stopTokenExpiryCheck();

		const tokenExpiry = this.tokenService.getTokenExpiry();
		if (!tokenExpiry) return;

		// Интервал проверки устанавливаем больше
		const interval = Math.max(this.refreshThreshold, 10 * 1000); // Проверяем каждые 10 секунд

		console.log(`Запуск проверки истечения токена с интервалом: ${interval / 1000} секунд.`);

		// Запускаем таймер
		this.tokenExpiryCheckTimer = timer(0, interval).subscribe(() => {
			const tokenExpiry = this.tokenService.getTokenExpiry();
			if (tokenExpiry && tokenExpiry - Date.now() < this.refreshThreshold) {
				console.log('Токен скоро истечёт. Выполняется обновление токена.');
				this.refreshToken().subscribe();
			} else if (tokenExpiry && tokenExpiry - Date.now() > this.refreshThreshold) {
				const remainingTime = Math.floor((tokenExpiry - Date.now()) / 1000);
				console.log(`Токен ещё действителен. Осталось: ${remainingTime} секунд.`);
			}

			// Проверяем авторизацию
			if (!this.isAuthenticated()) {
				console.warn('Токен истёк. Выполняется logout.');
				this.logout();
			}
		});
	}

	private stopTokenExpiryCheck(): void {
		if (this.tokenExpiryCheckTimer) {
			this.tokenExpiryCheckTimer.unsubscribe();
			this.tokenExpiryCheckTimer = null;
		}
	}
}
