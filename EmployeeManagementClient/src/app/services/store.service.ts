// store.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Store } from '../models/store.model';
import { map, catchError } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class StoreService {
	private baseApiUrl = 'http://localhost:8080/api';
	private storesApiUrl = `${this.baseApiUrl}/store`;
	private searchApiUrl = `${this.baseApiUrl}/SearchStores`;
	private suggestionsApiUrl = `${this.baseApiUrl}/suggestions`;

	constructor(private http: HttpClient) { }

	/**
	 * Получение магазинов с серверной пагинацией.
	 * @param page - текущая страница.
	 * @param pageSize - количество элементов на странице.
	 * @param filters - фильтры для поиска.
	 */
	getStores(page: number = 1, pageSize: number = 25, filters: { [key: string]: any } = {}): Observable<any> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		// Добавляем фильтры в параметры запроса
		Object.keys(filters).forEach((key) => {
			params = params.set(key, filters[key]);
		});

		return this.http.get<any>(`${this.storesApiUrl}`, { params }).pipe(
			map((response) => {
				const stores = response.stores || [];
				return {
					total: response.total || 0,
					stores: stores,
				};
			}),
			catchError((error) => {
				console.error('Error fetching stores:', error);
				return of({ total: 0, stores: [] });
			})
		);
	}

	/**
	 * Поиск магазинов без пагинации (для клиентской пагинации).
	 * Возвращает все соответствующие записи.
	 * @param filters - объект с фильтрами.
	 */
	searchAllStores(filters: { [key: string]: any }): Observable<Store[]> {
		let params = new HttpParams();

		// Добавляем фильтры в параметры запроса
		Object.keys(filters).forEach((key) => {
			params = params.set(key, filters[key]);
		});

		return this.http.get<Store[]>(`${this.searchApiUrl}/search`, { params }).pipe(
			catchError((error) => {
				console.error('Error searching stores:', error);
				return of([]);
			})
		);
	}

	getStoreById(id: number): Observable<Store> {
		return this.http.get<Store>(`${this.storesApiUrl}/${id}`);
	}

	createStore(store: Store): Observable<Store> {
		return this.http.post<Store>(`${this.storesApiUrl}`, store);
	}

	updateStore(id: number, store: Store): Observable<void> {
		return this.http.put<void>(`${this.storesApiUrl}/${id}`, store);
	}

	archiveStore(id: number): Observable<void> {
		return this.http.delete<void>(`${this.storesApiUrl}/${id}`);
	}

	unarchiveStore(id: number): Observable<void> {
		return this.http.put<void>(`${this.storesApiUrl}/Unarchive/${id}`, {});
	}

	getBuildingSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams().set('query', query);
		return this.http.get<any>(`${this.suggestionsApiUrl}/buildings`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}

	getFloorSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams().set('query', query);
		return this.http.get<any>(`${this.suggestionsApiUrl}/floors`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}

	getLineSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams().set('query', query);
		return this.http.get<any>(`${this.suggestionsApiUrl}/lines`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}

	getStoreNumberSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams().set('query', query);
		return this.http.get<any>(`${this.suggestionsApiUrl}/storeNumbers`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}
}
