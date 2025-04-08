// src/app/services/token.service.ts
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueueToken } from '../models/queue.model';
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class TokenService {

	constructor(private http: HttpClient) { }

	private readonly TOKEN_KEY = 'accessToken';
	private readonly REFRESH_TOKEN_KEY = 'refreshToken';
	private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';

	saveTokens(accessToken: string, refreshToken: string, tokenExpiry: number): void {
		localStorage.setItem(this.TOKEN_KEY, accessToken);
		localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
		localStorage.setItem(this.TOKEN_EXPIRY_KEY, tokenExpiry.toString());
		console.log('Токены сохранены в localStorage.');
	}

	getToken(): string | null {
		return localStorage.getItem(this.TOKEN_KEY);
	}

	getRefreshToken(): string | null {
		return localStorage.getItem(this.REFRESH_TOKEN_KEY);
	}

	getTokenExpiry(): number | null {
		const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
		return expiry ? parseInt(expiry, 10) : null;
	}

	clearTokens(): void {
		localStorage.removeItem(this.TOKEN_KEY);
		localStorage.removeItem(this.REFRESH_TOKEN_KEY);
		localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
		console.log('Токены очищены из localStorage.');
	}

	closeActiveToken(token: string): Observable<any> {
		const headers = new HttpHeaders({
			'Content-Type': 'application/json'
		});
		return this.http.post('/api/queue/close-token', { token }, { headers, responseType: 'json' });
	}

	getActiveToken(): string {
		// Получаем активный токен из localStorage или другого источника
		return localStorage.getItem('active_token') || '';
	}
}