import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Store, StoreDto } from '../models/store.model';

@Injectable({
	providedIn: 'root',
})
export class StoreService {
	private baseApiUrl = 'http://localhost:8080/api';
	private storesApiUrl = `${this.baseApiUrl}/Store`;
	private searchApiUrl = `${this.baseApiUrl}/SearchStores`;
	private suggestionsApiUrl = `${this.baseApiUrl}/suggestions`;
	private suggestionCache: { [key: string]: string[] } = {};

	constructor(private http: HttpClient) { }

	private getAuthHeaders(): HttpHeaders {
		const token = localStorage.getItem('token');
		return new HttpHeaders({
			Authorization: token ? `Bearer ${token}` : '',
			'Content-Type': 'application/json',
		});
	}

	clearSuggestionCache(): void {
		this.suggestionCache = {};
	}

	getStores(page: number = 1, pageSize: number = 25, filters: { [key: string]: any } = {}): Observable<{ total: number; stores: Store[] }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		Object.keys(filters).forEach((key) => {
			if (filters[key] !== undefined && filters[key] !== null) {
				params = params.set(key, filters[key].toString());
			}
		});

		return this.http.get<any>(this.storesApiUrl, { params, headers: this.getAuthHeaders() }).pipe(
			map((response) => ({
				total: response.total || 0,
				stores: (response.stores || []).map((dto: any) => this.mapStoreDtoToStore(dto)),
			})),
			catchError((error) => {
				console.error('Ошибка при получении магазинов:', error);
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

		return this.http.get<StoreDto[]>(`${this.searchApiUrl}/search`, { params, headers: this.getAuthHeaders() }).pipe(
			map((stores) => stores.map((dto) => this.mapStoreDtoToStore(dto))),
			catchError((error) => {
				console.error('Ошибка при поиске магазинов:', error);
				return of([]);
			})
		);
	}

	getStoreById(id: number): Observable<Store> {
		return this.http.get<StoreDto>(`${this.storesApiUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
			map((dto) => this.mapStoreDtoToStore(dto)),
			catchError((error) => {
				console.error('Ошибка при получении магазина:', error);
				return throwError(() => new Error(error.message || 'Не удалось получить магазин'));
			})
		);
	}

	createStore(store: Store): Observable<Store> {
		return this.http.post<StoreDto>(this.storesApiUrl, store, { headers: this.getAuthHeaders() }).pipe(
			map((dto) => this.mapStoreDtoToStore(dto)),
			catchError((error) => {
				console.error('Ошибка при создании магазина:', error);
				return throwError(() => new Error(error.message || 'Не удалось создать магазин'));
			})
		);
	}

	updateStore(id: number, store: Partial<Store>): Observable<void> {
		return this.http.put<void>(`${this.storesApiUrl}/${id}`, store, { headers: this.getAuthHeaders() }).pipe(
			catchError((error) => {
				console.error('Ошибка при обновлении магазина:', error);
				const errorMessage = error.error?.message || error.message || 'Не удалось обновить магазин';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	archiveStore(id: number): Observable<void> {
		return this.http.put<void>(`${this.storesApiUrl}/archive/${id}`, {}, { headers: this.getAuthHeaders() }).pipe(
			catchError((error) => {
				console.error('Ошибка при архивировании магазина:', error);
				const errorMessage = error.error?.message || error.message || 'Не удалось архивировать магазин';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	unarchiveStore(id: number): Observable<void> {
		return this.http.put<void>(`${this.storesApiUrl}/unarchive/${id}`, {}, { headers: this.getAuthHeaders() }).pipe(
			catchError((error) => {
				console.error('Ошибка при разархивировании магазина:', error);
				const errorMessage = error.error?.message || error.message || 'Не удалось разархивировать магазин';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	getBuildingSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const cacheKey = `buildings_${query}_${isArchived}`;
		if (this.suggestionCache[cacheKey]) {
			return of(this.suggestionCache[cacheKey]);
		}
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/buildings`, { params, headers: this.getAuthHeaders() }).pipe(
			map((response) => {
				this.suggestionCache[cacheKey] = response || [];
				return response || [];
			}),
			catchError(() => of([]))
		);
	}

	getFloorSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const cacheKey = `floors_${query}_${isArchived}`;
		if (this.suggestionCache[cacheKey]) {
			return of(this.suggestionCache[cacheKey]);
		}
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/floors`, { params, headers: this.getAuthHeaders() }).pipe(
			map((response) => {
				this.suggestionCache[cacheKey] = response || [];
				return response || [];
			}),
			catchError(() => of([]))
		);
	}

	getLineSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const cacheKey = `lines_${query}_${isArchived}`;
		if (this.suggestionCache[cacheKey]) {
			return of(this.suggestionCache[cacheKey]);
		}
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/lines`, { params, headers: this.getAuthHeaders() }).pipe(
			map((response) => {
				this.suggestionCache[cacheKey] = response || [];
				return response || [];
			}),
			catchError(() => of([]))
		);
	}

	getStoreNumberSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const cacheKey = `storeNumbers_${query}_${isArchived}`;
		if (this.suggestionCache[cacheKey]) {
			return of(this.suggestionCache[cacheKey]);
		}
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/storeNumbers`, { params, headers: this.getAuthHeaders() }).pipe(
			map((response) => {
				this.suggestionCache[cacheKey] = response || [];
				return response || [];
			}),
			catchError(() => of([]))
		);
	}

	private mapStoreDtoToStore(dto: any): Store {
		if (!dto) {
			throw new Error('Response is null');
		}
		return {
			id: dto.id,
			building: dto.building,
			floor: dto.floor,
			line: dto.line,
			storeNumber: dto.storeNumber,
			sortOrder: dto.sortOrder,
			note: dto.note,
			isArchived: dto.isArchived,
			createdAt: dto.createdAt,
			updatedAt: dto.updatedAt,
		};
	}
}