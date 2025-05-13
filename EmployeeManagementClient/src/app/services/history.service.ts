import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { HistoryEntry, ChangeValue } from '../models/history.model';

@Injectable({
	providedIn: 'root',
})
export class HistoryService {
	private apiUrl = 'http://localhost:8080/api/history';

	constructor(private http: HttpClient, private authService: AuthService) { }

	getHistory(entityType: string, entityId: string): Observable<HistoryEntry[]> {
		const token = this.authService.getToken();
		if (!token) {
			console.error('Токен отсутствует для запроса истории');
			return throwError(() => ({
				message: 'Токен авторизации отсутствует',
				error: 'No token found',
			}));
		}
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
		});

		const params = new HttpParams()
			.set('entityType', entityType)
			.set('entityId', entityId);

		return this.http.get<{ generalHistory: any[] }>(this.apiUrl, { headers, params }).pipe(
			map((response) => {
				console.debug('Ответ API истории:', response);
				const historyEntries = Array.isArray(response.generalHistory) ? response.generalHistory : [];

				if (!Array.isArray(historyEntries)) {
					console.warn('generalHistory не является массивом:', historyEntries);
					return [];
				}

				return historyEntries
					.map((entry: any): HistoryEntry => {
						if (!entry.changedAt) {
							console.warn(`Missing changedAt in history entry: ${JSON.stringify(entry)}`);
							return {
								id: entry.id || 0,
								entityType: entry.entityType || entityType,
								entityId: entry.entityId || entityId,
								action: entry.action || '',
								details: entry.details || 'Нет подробностей',
								changes: {},
								user: entry.changedBy || 'Неизвестно',
								timestamp: new Date(),
							};
						}

						const timestamp = new Date(entry.changedAt);
						if (isNaN(timestamp.getTime())) {
							console.warn(`Invalid changedAt in history entry: ${JSON.stringify(entry)}`);
							return {
								id: entry.id || 0,
								entityType: entry.entityType || entityType,
								entityId: entry.entityId || entityId,
								action: entry.action || '',
								details: entry.details || 'Нет подробностей',
								changes: {},
								user: entry.changedBy || 'Неизвестно',
								timestamp: new Date(),
							};
						}

						const changes: { [key: string]: ChangeValue } = entry.changes || {};

						return {
							id: entry.id || 0,
							entityType: entry.entityType || entityType,
							entityId: entry.entityId || entityId,
							action: entry.action || '',
							details: entry.details || 'Нет подробностей',
							changes,
							user: entry.changedBy || 'Неизвестно',
							timestamp,
						};
					})
					.sort((a: HistoryEntry, b: HistoryEntry) => b.timestamp.getTime() - a.timestamp.getTime());
			}),
			catchError((error) => {
				console.error(`Ошибка при загрузке истории для ${entityType} ${entityId}:`, error);
				return throwError(() => ({
					message: 'Не удалось загрузить историю изменений',
					error: error.message || 'Unknown error',
				}));
			})
		);
	}

	logHistory(entry: {
		entityType: string;
		entityId: string;
		action: string;
		details: string;
		changes: { [key: string]: ChangeValue };
		user: string;
	}): Observable<any> {
		const token = this.authService.getToken();
		if (!token) {
			console.error('Токен отсутствует для записи истории');
			return throwError(() => ({
				message: 'Токен авторизации отсутствует',
				error: 'No token found',
			}));
		}
		const headers = new HttpHeaders({
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		});

		const payload = {
			entityType: entry.entityType,
			entityId: entry.entityId,
			action: entry.action,
			details: entry.details,
			changes: entry.changes,
			changedBy: entry.user || this.authService.getCurrentUser() || 'Неизвестно',
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