import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PassType } from '../models/pass-type.model';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
	providedIn: 'root',
})
export class PassGroupTypeService {
	private baseUrl = '/api';

	constructor(private http: HttpClient) { }

	// Методы для групп пропусков
	getGroups(): Observable<any[]> {
		return this.http.get<any[]>(`${this.baseUrl}/passGroup`);
	}

	getGroupById(id: number): Observable<any> {
		return this.http.get<any>(`${this.baseUrl}/passGroup/${id}`);
	}

	createGroup(group: any): Observable<any> {
		return this.http.post<any>(`${this.baseUrl}/passGroup`, group);
	}

	updateGroup(group: any): Observable<any> {
		return this.http.put<any>(`${this.baseUrl}/passGroup/${group.id}`, group);
	}

	deleteGroup(id: number): Observable<any> {
		return this.http.delete<any>(`${this.baseUrl}/passGroup/${id}`);
	}

	// Методы для типов пропусков
	getTypes(groupId?: number): Observable<PassType[]> {
		let params = new HttpParams();
		if (groupId !== undefined) {
			params = params.set('groupId', groupId.toString());
		}
		return this.http.get<PassType[]>(`${this.baseUrl}/passType`, { params });
	}

	getTypeById(id: number): Observable<PassType> {
		return this.http.get<PassType>(`${this.baseUrl}/passType/${id}`);
	}

	createType(type: PassType): Observable<PassType> {
		return this.http.post<PassType>(`${this.baseUrl}/passType`, type);
	}

	updateType(type: PassType): Observable<void> {
		return this.http.put<void>(`${this.baseUrl}/passType/${type.id}`, type);
	}

	deleteType(id: number): Observable<void> {
		return this.http.delete<void>(`${this.baseUrl}/passType/${id}`);
	}

	searchPassTypes(id?: number, name?: string): Observable<PassType[]> {
		let params = new HttpParams();
		if (id) {
			params = params.set('id', id.toString());
		}
		if (name) {
			params = params.set('name', name);
		}

		return this.http.get<any>(`${this.baseUrl}/passType/search`, { params }).pipe(
			map(response => {
				if (Array.isArray(response)) {
					return response as PassType[];
				}
				else if (response && Array.isArray(response.passTypes)) {
					return response.passTypes as PassType[];
				}
				return [];
			}),
			catchError(error => {
				console.error('[searchPassTypes] Ошибка запроса:', error);
				return of([]);
			})
		);
	}
}
