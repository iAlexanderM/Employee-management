import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '../models/store.model';
import { map } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class StoreService {
	private baseApiUrl = 'http://localhost:8080/api';
	private storesApiUrl = `${this.baseApiUrl}/store`;
	private searchApiUrl = `${this.baseApiUrl}/searchstores`;
	private suggestionsApiUrl = `${this.baseApiUrl}/suggestions`;

	constructor(private http: HttpClient) { }

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
				const stores = response.stores?.$values || response.stores || [];
				return {
					total: response.total || 0,
					stores: stores,
				};
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
			// Преобразуем ответ, чтобы получить массив строк
			map((response) => response.$values || [])
		);
	}

	getFloorSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams().set('query', query);
		return this.http.get<any>(`${this.suggestionsApiUrl}/floors`, { params }).pipe(
			map((response) => response.$values || [])
		);
	}

	getLineSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams().set('query', query);
		return this.http.get<any>(`${this.suggestionsApiUrl}/lines`, { params }).pipe(
			map((response) => response.$values || [])
		);
	}

	getStoreNumberSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams().set('query', query);
		return this.http.get<any>(`${this.suggestionsApiUrl}/storeNumbers`, { params }).pipe(
			map((response) => response.$values || [])
		);
	}

	searchStores(criteria: { [key: string]: string | number }, page: number = 1, pageSize: number = 25): Observable<any> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		// Добавляем критерии поиска в параметры запроса
		Object.keys(criteria).forEach((key) => {
			params = params.set(key, criteria[key].toString());
		});

		return this.http.get<any>(`${this.storesApiUrl}/search`, { params }).pipe(
			map((response) => {
				const stores = response.stores?.$values || response.stores || [];
				return {
					total: response.total || 0,
					stores: stores,
				};
			})
		);
	}
}