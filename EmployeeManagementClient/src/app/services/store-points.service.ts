import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Building, Floor, Line, StoreNumber } from '../models/store-points.model';

@Injectable({
	providedIn: 'root'
})
export class StorePointsService {
	private baseApiUrl = 'http://localhost:8080/api';

	constructor(private http: HttpClient) { }

	getBuildings(
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
		const url = search ? `${this.baseApiUrl}/searchBuildings` : `${this.baseApiUrl}/Building`;

		return this.http.get<any>(url, { params }).pipe(
			map((response) => {
				const buildings = response.buildings?.$values || response.buildings || [];
				return {
					total: response.total || 0,
					buildings: buildings,
				};
			})
		);
	}

	getBuildingById(id: number): Observable<Building> {
		return this.http.get<Building>(`${this.baseApiUrl}/building/${id}`);
	}

	addBuilding(name: string): Observable<Building> {
		return this.http.post<Building>(`${this.baseApiUrl}/building`, { name });
	}

	updateBuilding(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/building/${id}`, { name, sortOrder });
	}


	getFloors(
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
		const url = search ? `${this.baseApiUrl}/searchFloors` : `${this.baseApiUrl}/Floor`;

		return this.http.get<any>(url, { params }).pipe(
			map((response) => {
				const floors = response.floors?.$values || response.floors || [];
				return {
					total: response.total || 0,
					floors: floors,
				};
			})
		);
	}

	getFloorById(id: number): Observable<Floor> {
		return this.http.get<Floor>(`${this.baseApiUrl}/floor/${id}`);
	}

	addFloor(name: string): Observable<Floor> {
		return this.http.post<Floor>(`${this.baseApiUrl}/floor`, { name });
	}

	updateFloor(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/floor/${id}`, { name, sortOrder });
	}

	// Lines
	getLines(
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
		const url = search ? `${this.baseApiUrl}/searchLines` : `${this.baseApiUrl}/Line`;

		return this.http.get<any>(url, { params }).pipe(
			map((response) => {
				const lines = response.lines?.$values || response.lines || [];
				return {
					total: response.total || 0,
					lines: lines,
				};
			})
		);
	}

	getLineById(id: number): Observable<Line> {
		return this.http.get<Line>(`${this.baseApiUrl}/line/${id}`);
	}

	addLine(name: string): Observable<Line> {
		return this.http.post<Line>(`${this.baseApiUrl}/line`, { name });
	}

	updateLine(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/line/${id}`, { name, sortOrder });
	}

	// Store Numbers
	getStoreNumbers(
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
		const url = search ? `${this.baseApiUrl}/searchStoreNumbers` : `${this.baseApiUrl}/StoreNumber`;

		return this.http.get<any>(url, { params }).pipe(
			map((response) => {
				const storeNumbers = response.storeNumbers?.$values || response.storeNumbers || [];
				return {
					total: response.total || 0,
					storeNumbers: storeNumbers,
				};
			})
		);
	}

	getStoreNumberById(id: number): Observable<StoreNumber> {
		return this.http.get<StoreNumber>(`${this.baseApiUrl}/storeNumber/${id}`);
	}

	addStoreNumber(name: string): Observable<StoreNumber> {
		return this.http.post<StoreNumber>(`${this.baseApiUrl}/storeNumber`, { name });
	}

	updateStoreNumber(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/storeNumber/${id}`, { name, sortOrder });
	}

	searchBuildings(
		criteria: { [key: string]: string | number } = {}
	): Observable<{ total: number; buildings: any[] }> {
		let params = new HttpParams();

		// Добавляем критерии поиска
		if (criteria && Object.keys(criteria).length > 0) {
			Object.keys(criteria).forEach((key) => {
				params = params.set(key, criteria[key].toString());
			});
		}

		return this.http.get<any>(`${this.baseApiUrl}/searchBuildings/search`, { params }).pipe(
			map((response) => {
				// Парсим ответ
				const buildings = response?.$values || []; // Извлекаем массив из $values
				return {
					total: buildings.length, // Количество зданий
					buildings, // Сами здания
				};
			}),
			catchError((error) => {
				console.error('[searchBuildings] Ошибка:', error);
				return of({ total: 0, buildings: [] }); // Возвращаем пустой результат в случае ошибки
			})
		);
	}

	searchFloors(
		criteria: { [key: string]: string | number } = {}
	): Observable<{ total: number; floors: any[] }> {
		let params = new HttpParams();

		if (criteria && Object.keys(criteria).length > 0) {
			Object.keys(criteria).forEach((key) => {
				params = params.set(key, criteria[key].toString());
			});
		}

		return this.http.get<any>(`${this.baseApiUrl}/searchFloors/search`, { params }).pipe(
			map((response) => {
				const floors = response?.$values || [];
				return {
					total: floors.length,
					floors,
				};
			}),
			catchError((error) => {
				console.error('[searchFloors] Ошибка:', error);
				return of({ total: 0, floors: [] });
			})
		);
	}

	searchLines(
		criteria: { [key: string]: string | number } = {}
	): Observable<{ total: number; lines: any[] }> {
		let params = new HttpParams();

		if (criteria && Object.keys(criteria).length > 0) {
			Object.keys(criteria).forEach((key) => {
				params = params.set(key, criteria[key].toString());
			});
		}

		return this.http.get<any>(`${this.baseApiUrl}/searchLines/search`, { params }).pipe(
			map((response) => {
				const lines = response?.$values || [];
				return {
					total: lines.length,
					lines,
				};
			}),
			catchError((error) => {
				console.error('[searchLines] Ошибка:', error);
				return of({ total: 0, lines: [] });
			})
		);
	}

	searchStoreNumbers(
		criteria: { [key: string]: string | number } = {}
	): Observable<{ total: number; storeNumbers: any[] }> {
		let params = new HttpParams();

		if (criteria && Object.keys(criteria).length > 0) {
			Object.keys(criteria).forEach((key) => {
				params = params.set(key, criteria[key].toString());
			});
		}

		return this.http.get<any>(`${this.baseApiUrl}/searchStoreNumbers/search`, { params }).pipe(
			map((response) => {
				const storeNumbers = response?.$values || [];
				return {
					total: storeNumbers.length,
					storeNumbers,
				};
			}),
			catchError((error) => {
				console.error('[searchStoreNumbers] Ошибка:', error);
				return of({ total: 0, storeNumbers: [] });
			})
		);
	}
}
