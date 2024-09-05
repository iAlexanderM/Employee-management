import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, EMPTY } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	private apiUrl = 'http://localhost:5290/api/auth'; // Базовый URL API
	private isAuthenticatedFlag = false; // Флаг для отслеживания состояния аутентификации
	private tokenKey = 'authToken'; // Ключ для хранения токена в LocalStorage
	private tokenExpiryKey = 'tokenExpiry'; // Ключ для хранения времени истечения токена в LocalStorage
	private token: string | null = null; // Локальная переменная для хранения токена

	constructor(private http: HttpClient) {
		// При инициализации сервиса проверяем, есть ли токен в LocalStorage
		const token = localStorage.getItem(this.tokenKey);
		const tokenExpiry = localStorage.getItem(this.tokenExpiryKey);

		if (token && tokenExpiry && Date.now() < Number(tokenExpiry)) {
			this.token = token;
			this.isAuthenticatedFlag = true; // Устанавливаем флаг аутентификации в true, если токен найден и не истек
		} else {
			this.logout(); // Выходим из системы, если токен отсутствует или истек
		}
	}

	/**
	 * Метод для входа пользователя
	 * @param username - Имя пользователя
	 * @param password - Пароль
	 * @returns Observable<boolean> - Возвращает Observable с результатом входа
	 */
	login(username: string, password: string): Observable<boolean> {
		return this.http.post<any>(`${this.apiUrl}/login`, { username, password }).pipe(
			tap(response => {
				this.isAuthenticatedFlag = true; // Устанавливаем флаг аутентификации в true
				this.token = response.token; // Сохраняем токен в переменную
				localStorage.setItem(this.tokenKey, response.token); // Сохраняем токен в LocalStorage

				const tokenExpiry = Date.now() + 30 * 60 * 1000; // Устанавливаем время истечения токена (например, 30 минут)
				localStorage.setItem(this.tokenExpiryKey, tokenExpiry.toString()); // Сохраняем время истечения в LocalStorage
			}),
			catchError(error => {
				console.error('Ошибка при логине', error); // Обрабатываем ошибки
				return of(false); // Возвращаем false в случае ошибки
			})
		);
	}

	/**
	 * Метод для выхода пользователя
	 * @returns Observable<void> - Возвращает Observable
	 */
	logout(): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
			tap(() => {
				this.isAuthenticatedFlag = false; // Сбрасываем флаг аутентификации
				this.token = null; // Очищаем локальный токен
				localStorage.removeItem(this.tokenKey); // Удаляем токен из LocalStorage
				localStorage.removeItem(this.tokenExpiryKey); // Удаляем время истечения срока действия токена
			}),
			catchError(error => {
				console.error('Ошибка при выходе из системы', error); // Обрабатываем ошибки
				return of(); // Возвращаем пустое значение в случае ошибки
			})
		);
	}

	/**
	 * Метод для проверки аутентификации пользователя
	 * @returns boolean - Возвращает true, если пользователь аутентифицирован
	 */
	isAuthenticated(): boolean {
		return this.isAuthenticatedFlag;
	}

	/**
	 * Метод для получения токена
	 * @returns string | null - Возвращает токен, если он существует
	 */
	getToken(): string | null {
		return this.token;
	}
}
