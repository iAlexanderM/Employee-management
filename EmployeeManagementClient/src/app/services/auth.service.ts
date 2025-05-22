import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer, Subscription, Subject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private apiUrl = '/api/auth';
	private inactivityTimeout: any;
	private tokenExpiryCheckTimer: Subscription | null = null;
	private readonly maxInactivityDuration = 30 * 60 * 1000; // 30 минут
	private readonly refreshThreshold = 10 * 60 * 1000; // 10 минут
	private isLoggingOut = false;

	public activeTokenCheck$ = new Subject<void>();

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
			this.activeTokenCheck$.next();
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
						const tokenExpiry = Date.now() + 30 * 60 * 1000;
						this.tokenService.saveTokens(response.accessToken, response.refreshToken, tokenExpiry);
						this.startInactivityTimer();
						this.startTokenExpiryCheck();
						console.log('Вход выполнен успешно. Токены сохранены.');
						if (this.router.url === '/login') {
							this.router.navigate(['/dashboard']);
						}
						this.activeTokenCheck$.next();
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
		if (this.isLoggingOut) {
			console.log('Logout уже выполняется, пропускаем повторный вызов.');
			return;
		}
		this.isLoggingOut = true;

		this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
			next: () => {
				this.cleanupAfterLogout();
			},
			error: (err) => {
				console.error('Ошибка при выходе из системы:', err);
				this.cleanupAfterLogout();
			}
		});
	}

	private cleanupAfterLogout(): void {
		this.tokenService.clearTokens();
		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
		}
		this.stopTokenExpiryCheck();
		this.tokenService.closeActiveToken(this.tokenService.getActiveToken());
		this.router.navigate(['/login']);
		this.isLoggingOut = false;
		console.log('Выход из системы выполнен. Пользователь перенаправлен на страницу логина.');
	}

	isAuthenticated(): boolean {
		const token = this.tokenService.getToken();
		const tokenExpiry = this.tokenService.getTokenExpiry();
		return !!(token && tokenExpiry && Date.now() < tokenExpiry);
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
						const newTokenExpiry = Date.now() + 30 * 60 * 1000;
						this.tokenService.saveTokens(response.accessToken, response.refreshToken, newTokenExpiry);
						this.startInactivityTimer();
						this.startTokenExpiryCheck();
						console.log('Токен успешно обновлён.');
						this.activeTokenCheck$.next();
					} else {
						console.warn('Ответ сервера не содержит accessToken при обновлении.');
						this.logout();
					}
				}),
				map(response => !!(response && response.accessToken)),
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
		console.log(`Таймер бездействия запущен на ${this.maxInactivityDuration / 60000} минут.`);
	}

	private startTokenExpiryCheck(): void {
		this.stopTokenExpiryCheck();
		const tokenExpiry = this.tokenService.getTokenExpiry();
		if (!tokenExpiry) return;
		const interval = Math.max(this.refreshThreshold, 10 * 1000);
		console.log(`Запуск проверки истечения токена с интервалом: ${interval / 1000} секунд.`);
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
				const remainingMinutes = Math.floor(timeRemaining / 60000);
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

	getUserRoles(): string[] {
		const token = this.tokenService.getToken();
		if (!token) return [];
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
			return Array.isArray(roles) ? roles : roles ? [roles] : [];
		} catch (e) {
			console.error('Ошибка при парсинге токена:', e);
			return [];
		}
	}

	hasRole(role: string): boolean {
		const userRoles = this.getUserRoles();
		return userRoles.includes(role);
	}

	getCurrentUser(): string | null {
		const token = this.tokenService.getToken();
		if (!token) return null;
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			return payload.sub || payload.name || null;
		} catch (e) {
			console.error('Ошибка при получении имени пользователя из токена:', e);
			return null;
		}
	}

	getCurrentUserId(): string | null {
		const token = this.tokenService.getToken();
		if (!token) return null;
		try {
			const payload = JSON.parse(atob(token.split('.')[1]));
			console.log('JWT payload:', payload);
			return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub || null;
		} catch (e) {
			console.error('Ошибка при получении UUID пользователя из токена:', e);
			return null;
		}
	}
}