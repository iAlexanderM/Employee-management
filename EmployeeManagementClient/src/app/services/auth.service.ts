import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private apiUrl = 'http://localhost:5290/api';
	private isAuthenticatedFlag = false;
	private token: string | null = null;

	constructor(private http: HttpClient) { }

	login(username: string, password: string): Observable<boolean> {
		return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
			tap(response => {
				this.isAuthenticatedFlag = true;
				this.token = response.token;
			}),
			catchError(error => {
				console.error('Ошибка при логине', error);
				return of(false);
			})
		);
	}

	register(username: string, password: string): Observable<boolean> {
		return this.http.post<any>(`${this.apiUrl}/register`, { username, password }).pipe(
			tap(response => true),
			catchError(error => {
				console.error('Ошибка при регистрации', error);
				return of(false);
			})
		);
	}

	logout(): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
			tap(() => {
				this.isAuthenticatedFlag = false;
				this.token = null;
			}),
			catchError(error => {
				console.error('Ошибка при выходе из системы', error);
				return of();
			})
		);
	}

	isAuthenticated(): boolean {
		return this.isAuthenticatedFlag;
	}

	getToken(): string | null {
		return this.token;
	}
}
