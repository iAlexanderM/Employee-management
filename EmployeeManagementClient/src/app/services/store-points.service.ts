import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Building, Floor, Line, StoreNumber } from '../models/store-points.model';

@Injectable({
	providedIn: 'root'
})
export class StorePointsService {
	private baseApiUrl = 'http://localhost:8080/api';

	constructor(private http: HttpClient) { }

	private getParams(page: number, pageSize: number, filters: { [key: string]: any } = {}, isArchived = false): HttpParams {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString())
			.set('isArchived', isArchived.toString());

		Object.keys(filters).forEach((key) => {
			if (filters[key]) {
				params = params.set(key, filters[key].toString());
			}
		});

		return params;
	}

	getBuildings(page: number = 1, pageSize: number = 25, filters: { [key: string]: any } = {}, isArchived = false): Observable<{ total: number; buildings: Building[] }> {
		const params = this.getParams(page, pageSize, filters, isArchived);
		return this.http.get<any>(`${this.baseApiUrl}/Building`, { params }).pipe(
			map(response => ({
				total: response.total || 0,
				buildings: response.buildings || []
			})),
			catchError(error => {
				console.error('[getBuildings] Error:', error);
				return of({ total: 0, buildings: [] });
			})
		);
	}

	getBuildingById(id: number): Observable<Building> {
		return this.http.get<Building>(`${this.baseApiUrl}/Building/${id}`).pipe(
			catchError(error => {
				console.error('[getBuildingById] Error:', error);
				return throwError(() => new Error('Failed to fetch building'));
			})
		);
	}

	addBuilding(name: string): Observable<Building> {
		return this.http.post<Building>(`${this.baseApiUrl}/Building`, { name }).pipe(
			catchError(error => {
				console.error('[addBuilding] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to add building'));
			})
		);
	}

	updateBuilding(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/Building/${id}`, { name, sortOrder }).pipe(
			catchError(error => {
				console.error('[updateBuilding] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to update building'));
			})
		);
	}

	getFloors(page: number = 1, pageSize: number = 25, filters: { [key: string]: any } = {}, isArchived = false): Observable<{ total: number; floors: Floor[] }> {
		const params = this.getParams(page, pageSize, filters, isArchived);
		return this.http.get<any>(`${this.baseApiUrl}/floors`, { params }).pipe(
			map(response => ({
				total: response.total || response.data?.length || 0,
				floors: response.data || []
			})),
			catchError(error => {
				console.error('[getFloors] Error:', error);
				return of({ total: 0, floors: [] });
			})
		);
	}

	getFloorById(id: number): Observable<Floor> {
		return this.http.get<Floor>(`${this.baseApiUrl}/floors/${id}`).pipe(
			catchError(error => {
				console.error('[getFloorById] Error:', error);
				return throwError(() => new Error('Failed to fetch floor'));
			})
		);
	}

	addFloor(name: string): Observable<Floor> {
		return this.http.post<Floor>(`${this.baseApiUrl}/floors`, { name }).pipe(
			catchError(error => {
				console.error('[addFloor] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to add floor'));
			})
		);
	}

	updateFloor(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/floors/${id}`, { name, sortOrder }).pipe(
			catchError(error => {
				console.error('[updateFloor] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to update floor'));
			})
		);
	}

	getLines(page: number = 1, pageSize: number = 25, filters: { [key: string]: any } = {}, isArchived = false): Observable<{ total: number; lines: Line[] }> {
		const params = this.getParams(page, pageSize, filters, isArchived);
		return this.http.get<any>(`${this.baseApiUrl}/lines`, { params }).pipe(
			map(response => ({
				total: response.total || response.data?.length || 0,
				lines: response.data || []
			})),
			catchError(error => {
				console.error('[getLines] Error:', error);
				return of({ total: 0, lines: [] });
			})
		);
	}

	getLineById(id: number): Observable<Line> {
		return this.http.get<Line>(`${this.baseApiUrl}/lines/${id}`).pipe(
			catchError(error => {
				console.error('[getLineById] Error:', error);
				return throwError(() => new Error('Failed to fetch line'));
			})
		);
	}

	addLine(name: string): Observable<Line> {
		return this.http.post<Line>(`${this.baseApiUrl}/lines`, { name }).pipe(
			catchError(error => {
				console.error('[addLine] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to add line'));
			})
		);
	}

	updateLine(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/lines/${id}`, { name, sortOrder }).pipe(
			catchError(error => {
				console.error('[updateLine] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to update line'));
			})
		);
	}

	getStoreNumbers(page: number = 1, pageSize: number = 25, filters: { [key: string]: any } = {}, isArchived = false): Observable<{ total: number; storeNumbers: StoreNumber[] }> {
		const params = this.getParams(page, pageSize, filters, isArchived);
		return this.http.get<any>(`${this.baseApiUrl}/store-numbers`, { params }).pipe(
			map(response => ({
				total: response.total || response.data?.length || 0,
				storeNumbers: response.data || []
			})),
			catchError(error => {
				console.error('[getStoreNumbers] Error:', error);
				return of({ total: 0, storeNumbers: [] });
			})
		);
	}

	getStoreNumberById(id: number): Observable<StoreNumber> {
		return this.http.get<StoreNumber>(`${this.baseApiUrl}/store-numbers/${id}`).pipe(
			catchError(error => {
				console.error('[getStoreNumberById] Error:', error);
				return throwError(() => new Error('Failed to fetch store number'));
			})
		);
	}

	addStoreNumber(name: string): Observable<StoreNumber> {
		return this.http.post<StoreNumber>(`${this.baseApiUrl}/store-numbers`, { name }).pipe(
			catchError(error => {
				console.error('[addStoreNumber] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to add store number'));
			})
		);
	}

	updateStoreNumber(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/store-numbers/${id}`, { name, sortOrder }).pipe(
			catchError(error => {
				console.error('[updateStoreNumber] Error:', error);
				return throwError(() => new Error(error.error?.message || 'Failed to update store number'));
			})
		);
	}

	searchBuildings(criteria: { [key: string]: string | number } = {}, isArchived = false): Observable<{ total: number; buildings: Building[] }> {
		let params = new HttpParams().set('isArchived', isArchived.toString());
		Object.keys(criteria).forEach(key => {
			params = params.set(key, criteria[key].toString());
		});
		return this.http.get<any>(`${this.baseApiUrl}/SearchBuildings/search`, { params }).pipe(
			map(response => ({
				total: response.total || response.data?.length || 0,
				buildings: response.data || []
			})),
			catchError(error => {
				console.error('[searchBuildings] Error:', error);
				return of({ total: 0, buildings: [] });
			})
		);
	}

	searchFloors(criteria: { [key: string]: string | number } = {}, isArchived = false): Observable<{ total: number; floors: Floor[] }> {
		let params = new HttpParams().set('isArchived', isArchived.toString());
		Object.keys(criteria).forEach(key => {
			params = params.set(key, criteria[key].toString());
		});
		return this.http.get<any>(`${this.baseApiUrl}/floors/search`, { params }).pipe(
			map(response => ({
				total: response.total || response.data?.length || 0,
				floors: response.data || []
			})),
			catchError(error => {
				console.error('[searchFloors] Error:', error);
				return of({ total: 0, floors: [] });
			})
		);
	}

	searchLines(criteria: { [key: string]: string | number } = {}, isArchived = false): Observable<{ total: number; lines: Line[] }> {
		let params = new HttpParams().set('isArchived', isArchived.toString());
		Object.keys(criteria).forEach(key => {
			params = params.set(key, criteria[key].toString());
		});
		return this.http.get<any>(`${this.baseApiUrl}/lines/search`, { params }).pipe(
			map(response => ({
				total: response.total || response.data?.length || 0,
				lines: response.data || []
			})),
			catchError(error => {
				console.error('[searchLines] Error:', error);
				return of({ total: 0, lines: [] });
			})
		);
	}

	searchStoreNumbers(criteria: { [key: string]: string | number } = {}, isArchived = false): Observable<{ total: number; storeNumbers: StoreNumber[] }> {
		let params = new HttpParams().set('isArchived', isArchived.toString());
		Object.keys(criteria).forEach(key => {
			params = params.set(key, criteria[key].toString());
		});
		return this.http.get<any>(`${this.baseApiUrl}/store-numbers/search`, { params }).pipe(
			map(response => ({
				total: response.total || response.data?.length || 0,
				storeNumbers: response.data || []
			})),
			catchError(error => {
				console.error('[searchStoreNumbers] Error:', error);
				return of({ total: 0, storeNumbers: [] });
			})
		);
	}
}