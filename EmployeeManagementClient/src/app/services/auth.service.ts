import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private tokenKey = 'authToken';

	constructor(private http: HttpClient) { }

	login(username: string, password: string): Observable<any> {
		return this.http.post<any>('http://localhost:5290/api/auth/login', { username, password }).pipe(
			tap((response: any) => {
				this.setToken(response.token);
			})
		);
	}

	setToken(token: string): void {
		localStorage.setItem(this.tokenKey, token);
	}

	getToken(): string | null {
		return localStorage.getItem(this.tokenKey);
	}

	isLoggedIn(): boolean {
		return !!this.getToken();
	}

	logout(): void {
		localStorage.removeItem(this.tokenKey);
	}

	isAuthenticated(): boolean {
		return this.isLoggedIn();
	}
}
