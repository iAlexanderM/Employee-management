import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { Store, StoreDto } from '../models/store.model';
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

	getStores(page: number = 1, pageSize: number = 25, filters: { [key: string]: any } = {}): Observable<any> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		Object.keys(filters).forEach((key) => {
			if (filters[key] !== undefined && filters[key] !== null) {
				params = params.set(key, filters[key].toString());
			}
		});

		return this.http.get<any>(`${this.storesApiUrl}`, { params }).pipe(
			map((response) => {
				const stores = response.stores || [];
				return {
					total: response.total || 0,
					stores: stores.map(this.mapStoreDtoToStore),
				};
			}),
			catchError((error) => {
				console.error('Error fetching stores:', error);
				return of({ total: 0, stores: [] });
			})
		);
	}

	searchAllStores(filters: { [key: string]: any }): Observable<Store[]> {
		let params = new HttpParams();

		Object.keys(filters).forEach((key) => {
			if (filters[key] !== undefined && filters[key] !== null) {
				params = params.set(key, filters[key].toString());
			}
		});

		return this.http.get<StoreDto[]>(`${this.searchApiUrl}/search`, { params }).pipe(
			map((stores) => stores.map(this.mapStoreDtoToStore)),
			catchError((error) => {
				console.error('Error searching stores:', error);
				return of([]);
			})
		);
	}

	getStoreById(id: number): Observable<Store> {
		return this.http.get<StoreDto>(`${this.storesApiUrl}/${id}`).pipe(
			map(this.mapStoreDtoToStore),
			catchError((error) => {
				console.error('Error fetching store:', error);
				throw error;
			})
		);
	}

	createStore(store: Store): Observable<Store> {
		return this.http.post<StoreDto>(`${this.storesApiUrl}`, store).pipe(
			map(this.mapStoreDtoToStore),
			catchError((error) => {
				console.error('Error creating store:', error);
				throw error;
			})
		);
	}

	archiveStore(id: number): Observable<void> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json',
		});
		return this.http.put<void>(`${this.storesApiUrl}/archive/${id}`, {}, { headers }).pipe(
			catchError((err) => {
				console.error('Ошибка при архивировании магазина:', err);
				const errorMessage = err.error?.message || err.message || 'Неизвестная ошибка при архивировании';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	unarchiveStore(id: number): Observable<void> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json',
		});
		return this.http.put<void>(`${this.storesApiUrl}/unarchive/${id}`, {}, { headers }).pipe(
			catchError((error) => {
				console.error('Ошибка при разархивировании магазина:', error);
				const errorMessage = error.error?.message || error.message || 'Неизвестная ошибка при разархивировании';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	updateStore(id: string, store: Partial<Store>): Observable<Store> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json',
		});
		return this.http.put<StoreDto>(`${this.storesApiUrl}/${id}`, store, { headers }).pipe(
			map(this.mapStoreDtoToStore),
			catchError((error) => {
				console.error('Ошибка при обновлении магазина:', error);
				const errorMessage = error.error?.message || error.message || 'Неизвестная ошибка при обновлении';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	getBuildingSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('IsArchived', 'false'); // Фильтр только неархивные
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/buildings`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}

	getFloorSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('IsArchived', 'false'); // Фильтр только неархивные
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/floors`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}

	getLineSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('IsArchived', 'false'); // Фильтр только неархивные
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/lines`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}

	getStoreNumberSuggestions(query: string): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('IsArchived', 'false'); // Фильтр только неархивные
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/storeNumbers`, { params }).pipe(
			map((response) => response || []),
			catchError(() => of([]))
		);
	}

	private mapStoreDtoToStore(dto: StoreDto): Store {
		return {
			id: dto.id,
			building: dto.building,
			floor: dto.floor,
			line: dto.line,
			storeNumber: dto.storeNumber,
			sortOrder: dto.sortOrder,
			isArchived: dto.isArchived,
			createdAt: new Date(dto.createdAt),
			note: dto.note,
		};
	}
}