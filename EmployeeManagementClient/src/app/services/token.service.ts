import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class TokenService {
	private tokenKey = 'authToken';
	private tokenExpiryKey = 'tokenExpiry';
	private refreshTokenKey = 'refreshToken';

	getToken(): string | null {
		return localStorage.getItem(this.tokenKey);
	}

	getRefreshToken(): string | null {
		return localStorage.getItem(this.refreshTokenKey);
	}

	getTokenExpiry(): number | null {
		const expiry = localStorage.getItem(this.tokenExpiryKey);
		return expiry ? Number(expiry) : null;
	}

	saveTokens(accessToken: string, refreshToken: string, expiresInMs: number): void {
		const expiryTime = Date.now() + expiresInMs;

		localStorage.setItem(this.tokenKey, accessToken);
		localStorage.setItem(this.refreshTokenKey, refreshToken);
		localStorage.setItem(this.tokenExpiryKey, expiryTime.toString());

		console.log(`Токен сохранён. Время истечения: ${new Date(expiryTime).toLocaleString()}`);
	}

	clearTokens(): void {
		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(this.tokenExpiryKey);
		localStorage.removeItem(this.refreshTokenKey);
		console.log('Токены удалены.');
	}
}
