
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
	private readonly maxInactivityDuration = 30 * 60 * 1000;
	private readonly refreshThreshold = 10 * 60 * 1000;
	private isLoggingOut = false;

	public activeTokenCheck$ = new Subject<void>();

	constructor(
		private http: HttpClient,
		private tokenService: TokenService,
		private router: Router
	) { }

	initializeToken(): Observable<boolean> {
		const accessToken = this.tokenService.getAccessToken();
		const tokenExpiry = this.tokenService.getTokenExpiry();

		if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
			console.log(`Токен доступа активен.Истекает: ${new Date(tokenExpiry).toLocaleString()} `);
			this.startInactivityTimer();
			this.startTokenExpiryCheck();
			this.activeTokenCheck$.next();
			return of(true);
		}

		if (this.tokenService.getRefreshToken()) {
			console.log('Токен доступа истёк. Попытка обновления.');
			return this.refreshToken();
		}

		console.warn('Нет токена доступа или refresh токена. Пользователь не авторизован.');
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
		const activeTokenToClose = this.tokenService.getActiveQueueToken();

		localStorage.clear();
		console.log('localStorage полностью очищен.');

		if (this.inactivityTimeout) {
			clearTimeout(this.inactivityTimeout);
		}
		this.stopTokenExpiryCheck();

		if (activeTokenToClose) {
			this.tokenService.closeActiveToken(activeTokenToClose).subscribe({
				next: () => console.log('Active token закрыт на сервере.'),
				error: (err) => console.error('Ошибка при закрытии active token на сервере:', err)
			});
		}

		this.router.navigate(['/login']);
		this.isLoggingOut = false;
		console.log('Выход из системы выполнен. Пользователь перенаправлен на страницу логина.');
	}

	isAuthenticated(): boolean {
		const accessToken = this.tokenService.getAccessToken();
		const tokenExpiry = this.tokenService.getTokenExpiry();
		return !!(accessToken && tokenExpiry && Date.now() < tokenExpiry);
	}

	refreshToken(): Observable<boolean> {
		const refreshToken = this.tokenService.getRefreshToken();
		if (!refreshToken) {
			console.error('Refresh токен отсутствует. Выполняется logout.');
			this.logout();
			return of(false);
		}
		console.log('Попытка обновления токена доступа...');
		return this.http
			.post<{ accessToken: string; refreshToken: string }>(`${this.apiUrl}/refresh`, { refreshToken })
			.pipe(
				tap(response => {
					if (response?.accessToken) {
						const newTokenExpiry = Date.now() + 30 * 60 * 1000;
						this.tokenService.saveTokens(response.accessToken, response.refreshToken, newTokenExpiry);
						this.startInactivityTimer();
						this.startTokenExpiryCheck();
						console.log('Токен доступа успешно обновлён.');
						this.activeTokenCheck$.next();
					} else {
						console.warn('Ответ сервера не содержит accessToken при обновлении.');
						this.logout();
					}
				}),
				map(response => !!(response && response.accessToken)),
				catchError(error => {
					console.error('Ошибка при обновлении токена доступа', error);
					this.logout();
					return of(false);
				})
			);
	}

	getAccessToken(): string | null {
		return this.tokenService.getAccessToken();
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
		console.log(`Запуск проверки истечения токена доступа с интервалом: ${interval / 1000} секунд.`);
		this.tokenExpiryCheckTimer = timer(0, interval).subscribe(() => {
			const currentTokenExpiry = this.tokenService.getTokenExpiry();
			if (!currentTokenExpiry) {
				console.warn('Отсутствует время истечения токена доступа. Выполняется logout.');
				this.logout();
				return;
			}
			const timeRemaining = currentTokenExpiry - Date.now();
			if (timeRemaining < this.refreshThreshold && timeRemaining > 0) {
				console.log('Токен доступа скоро истечёт. Выполняется обновление токена.');
				this.refreshToken().subscribe(success => {
					if (!success) {
						console.warn('Не удалось обновить токен доступа. Выполняется logout.');
						this.logout();
					}
				});
			} else if (timeRemaining <= 0) {
				console.warn('Токен доступа истёк. Выполняется logout.');
				this.logout();
			} else {
				const remainingMinutes = Math.floor(timeRemaining / 60000);
				console.log(`Токен доступа ещё действителен. Осталось: ${remainingMinutes} минут.`);
			}
		});
	}

	private stopTokenExpiryCheck(): void {
		if (this.tokenExpiryCheckTimer) {
			this.tokenExpiryCheckTimer.unsubscribe();
			this.tokenExpiryCheckTimer = null;
			console.log('Проверка истечения токена доступа остановлена.');
		}
	}

	getUserRoles(): string[] {
		const accessToken = this.tokenService.getAccessToken();
		if (!accessToken) return [];
		try {
			const payload = JSON.parse(atob(accessToken.split('.')[1]));
			const roles = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
			return Array.isArray(roles) ? roles : roles ? [roles] : [];
		} catch (e) {
			console.error('Ошибка при парсинге токена доступа:', e);
			return [];
		}
	}

	hasRole(role: string): boolean {
		const userRoles = this.getUserRoles();
		return userRoles.includes(role);
	}

	getCurrentUser(): string | null {
		const accessToken = this.tokenService.getAccessToken();
		if (!accessToken) return null;
		try {
			const payload = JSON.parse(atob(accessToken.split('.')[1]));
			return payload.sub || payload.name || null;
		} catch (e) {
			console.error('Ошибка при получении имени пользователя из токена доступа:', e);
			return null;
		}
	}

	getCurrentUserId(): string | null {
		const accessToken = this.tokenService.getAccessToken();
		if (!accessToken) return null;
		try {
			const payload = JSON.parse(atob(accessToken.split('.')[1]));
			console.log('JWT payload:', payload);
			return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload.sub || null;
		} catch (e) {
			console.error('Ошибка при получении UUID пользователя из токена доступа:', e);
			return null;
		}
	}
}