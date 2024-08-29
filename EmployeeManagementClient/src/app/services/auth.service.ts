import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private apiUrl = 'http://localhost:5290/api/Account';  // URL API бэкенда

	constructor(private http: HttpClient, private router: Router) { }

	// Метод регистрации пользователя
	register(userData: any): Observable<any> {
		return this.http.post(`${this.apiUrl}/Register`, userData);
	}

	// Метод входа пользователя
	login(credentials: any): Observable<any> {
		return this.http.post(`${this.apiUrl}/Login`, credentials);
	}

	// Метод выхода пользователя
	logout(): void {
		localStorage.removeItem('token');
		this.router.navigate(['/login']);
	}

	// Проверка, залогинен ли пользователь
	isAuthenticated(): boolean {
		return !!localStorage.getItem('token');
	}

	// Метод для получения текущего пользователя из токена
	getCurrentUser(): any {
		const token = localStorage.getItem('token');
		if (!token) return null;

		try {
			const tokenPayload = JSON.parse(atob(token.split('.')[1]));
			return {
				id: tokenPayload.id,
				username: tokenPayload.username,
				roles: tokenPayload.roles || []
			};
		} catch (e) {
			console.error('Ошибка при декодировании токена', e);
			return null;
		}
	}
}
