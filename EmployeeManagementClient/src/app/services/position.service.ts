import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Position } from '../models/position.model';

@Injectable({
	providedIn: 'root'
})
export class PositionService {
	private baseApiUrl = 'http://localhost:8080/api';

	constructor(private http: HttpClient) { }

	getPositions(
		page: number = 1,
		pageSize: number = 25,
		filters: { [key: string]: any } = {},
		search: boolean = false
	): Observable<any> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		// Добавляем фильтры
		Object.keys(filters).forEach((key) => {
			params = params.set(key, filters[key]);
		});

		// Выбираем URL в зависимости от флага `search`
		const url = search ? `${this.baseApiUrl}/searchPositions` : `${this.baseApiUrl}/position`;

		return this.http.get<any>(url, { params }).pipe(
			map((response) => ({
				total: response.total || 0,
				positions: response.positions || [],
			}))
		);
	}

	getPositionById(id: number): Observable<Position> {
		return this.http.get<Position>(`${this.baseApiUrl}/position/${id}`);
	}

	addPosition(name: string): Observable<Position> {
		return this.http.post<Position>(`${this.baseApiUrl}/position`, { name });
	}

	updatePosition(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/position/${id}`, { name, sortOrder });
	}

	searchPositions(
		criteria: { [key: string]: string | number } = {}
	): Observable<{ total: number; positions: any[] }> {
		let params = new HttpParams();

		// Добавляем критерии поиска
		if (criteria && Object.keys(criteria).length > 0) {
			Object.keys(criteria).forEach((key) => {
				params = params.set(key, criteria[key].toString());
			});
		}

		return this.http
			.get<any>(`${this.baseApiUrl}/searchPositions/search`, { params })
			.pipe(
				map((response) => {
					// Если сервер вернул массив вида: [ { id, name }, ... ]
					if (Array.isArray(response)) {
						return {
							total: response.length,
							positions: response
						};
					}
					// Иначе, если объект: { total, positions }, обрабатываем как раньше
					const positions = response.positions || [];
					return {
						total: response.total ?? positions.length,
						positions
					};
				}),
				catchError((error) => {
					console.error('[searchPositions] Ошибка:', error);
					return of({ total: 0, positions: [] });
				})
			);

	}
}