import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { HistoryEntry, ChangeValue } from '../models/history.model';
import { ApplicationUser } from '../models/application-user.model';

@Injectable({
	providedIn: 'root',
})
export class HistoryService {
	private apiUrl = 'http://localhost:8080/api/history';

	constructor(
		private http: HttpClient,
		private authService: AuthService,
		private userService: UserService
	) { }

	getHistory(entityType: string, entityId: string): Observable<HistoryEntry[]> {
		const accessToken = this.authService.getAccessToken();
		if (!accessToken) {
			console.error('Токен отсутствует для запроса истории');
			return throwError(() => ({
				message: 'Токен авторизации отсутствует',
				error: 'No accessToken found',
			}));
		}
		const headers = new HttpHeaders({
			Authorization: `Bearer ${accessToken}`,
		});

		const params = new HttpParams()
			.set('entityType', entityType)
			.set('entityId', entityId);

		return this.http.get<{ generalHistory: any[] }>(this.apiUrl, { headers, params }).pipe(
			map((response) => {
				console.debug('Ответ API истории:', response);
				const historyEntries = Array.isArray(response?.generalHistory) ? response.generalHistory : [];

				if (!Array.isArray(historyEntries)) {
					console.warn('generalHistory не является массивом:', response);
					return [];
				}

				return historyEntries
					.map((entry: any, index: number): HistoryEntry => {
						if (!entry) {
							console.warn(`Пустая запись истории на индексе ${index}`);
							return this.createDefaultHistoryEntry(entry, entityType, entityId);
						}

						const timestamp = entry.changedAt ? new Date(entry.changedAt) : new Date();
						if (isNaN(timestamp.getTime())) {
							console.warn(`Некорректный changedAt в записи истории: ${JSON.stringify(entry)}`);
							return this.createDefaultHistoryEntry(entry, entityType, entityId);
						}

						return {
							id: entry.id || 0,
							entityType: entry.entityType || entityType,
							entityId: entry.entityId || entityId,
							action: entry.action || '',
							details: entry.details || 'Нет подробностей',
							changes: entry.changes || {},
							user: entry.changedBy || 'Неизвестно',
							timestamp,
						};
					})
					.sort((a: HistoryEntry, b: HistoryEntry) => b.timestamp.getTime() - a.timestamp.getTime());
			}),
			catchError((error) => {
				console.error(`Ошибка при загрузке истории для ${entityType} ${entityId}:`, {
					status: error.status,
					statusText: error.statusText,
					message: error.message,
					error: error.error,
				});
				return throwError(() => ({
					message: 'Не удалось загрузить историю изменений',
					error: error.message || 'Unknown error',
					status: error.status,
				}));
			})
		);
	}

	private createDefaultHistoryEntry(entry: any, entityType: string, entityId: string): HistoryEntry {
		return {
			id: entry?.id || 0,
			entityType: entityType,
			entityId: entityId,
			action: entry?.action || '',
			details: entry?.details || 'Нет подробностей',
			changes: {},
			user: entry?.changedBy || 'Неизвестно',
			timestamp: new Date(),
		};
	}

	logHistory(entry: {
		entityType: string;
		entityId: string;
		action: string;
		details: string;
		changes: { [key: string]: ChangeValue };
		user?: string;
	}): Observable<any> {
		const accessToken = this.authService.getAccessToken();
		if (!accessToken) {
			console.error('Токен отсутствует для записи истории');
			return throwError(() => ({
				message: 'Токен авторизации отсутствует',
				error: 'No accessToken found',
			}));
		}
		const headers = new HttpHeaders({
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		});

		const user = this.userService.getCurrentUser();
		const changedBy = entry.user || (user && user.userName ? user.userName : 'Неизвестно');
		console.debug('Устанавливаем changedBy:', changedBy);
		const payload = {
			entityType: entry.entityType,
			entityId: entry.entityId,
			action: entry.action,
			details: entry.details,
			changes: entry.changes,
			changedBy: changedBy,
			changedAt: new Date().toISOString(),
		};

		console.debug('Отправляемый payload для истории:', payload);

		return this.http.post(this.apiUrl, payload, { headers }).pipe(
			catchError((error) => {
				console.error(`Ошибка при фиксации истории для ${entry.entityType} ${entry.entityId}:`, error);
				return throwError(() => ({
					message: 'Не удалось зафиксировать историю изменений',
					error: error.message || 'Unknown error',
				}));
			})
		);
	}
}