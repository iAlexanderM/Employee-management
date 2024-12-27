import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Nationality, Citizenship } from '../models/contractor-points.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorPointsService {
	private baseApiUrl = 'http://localhost:8080/api';

	constructor(private http: HttpClient) { }

	//Nationalities
	getNationalities(
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
		const url = search ? `${this.baseApiUrl}/searchNationalities` : `${this.baseApiUrl}/Nationality`;

		return this.http.get<any>(url, { params }).pipe(
			map((response) => {
				const nationalities = response.nationalities || [];
				return {
					total: response.total || 0,
					nationalities: nationalities,
				};
			})
		);
	}

	getNationalityById(id: number): Observable<Nationality> {
		return this.http.get<Nationality>(`${this.baseApiUrl}/nationality/${id}`);
	}

	addNationality(name: string): Observable<Nationality> {
		return this.http.post<Nationality>(`${this.baseApiUrl}/nationality`, { name });
	}

	updateNationality(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/nationality/${id}`, { name, sortOrder });
	}

	searchNationalities(
		criteria: { [key: string]: string | number } = {}
	): Observable<{ total: number; nationalities: any[] }> {
		let params = new HttpParams();

		// Добавляем критерии поиска
		if (criteria && Object.keys(criteria).length > 0) {
			Object.keys(criteria).forEach((key) => {
				params = params.set(key, criteria[key].toString());
			});
		}

		return this.http.get<any>(`${this.baseApiUrl}/searchNationalities/search`, { params }).pipe(
			map((response) => {
				// Парсим ответ
				const nationalities = response.nationalities || [];
				return {
					total: nationalities.length,
					nationalities,
				};
			}),
			catchError((error) => {
				console.error('[searchNationalities] Ошибка:', error);
				return of({ total: 0, nationalities: [] });
			})
		);
	}

	//Citizenships
	getCitizenships(
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
		const url = search ? `${this.baseApiUrl}/searchCitizenships` : `${this.baseApiUrl}/Citizenship`;

		return this.http.get<any>(url, { params }).pipe(
			map((response) => {
				const citizenships = response.citizenships || [];
				return {
					total: response.total || 0,
					citizenships: citizenships,
				};
			})
		);
	}

	getCitizenshipById(id: number): Observable<Citizenship> {
		return this.http.get<Citizenship>(`${this.baseApiUrl}/citizenship/${id}`);
	}

	addCitizenship(name: string): Observable<Citizenship> {
		return this.http.post<Citizenship>(`${this.baseApiUrl}/citizenship`, { name });
	}

	updateCitizenship(id: number, name: string, sortOrder: number): Observable<void> {
		return this.http.put<void>(`${this.baseApiUrl}/citizenship/${id}`, { name, sortOrder });
	}

	searchCitizenships(
		criteria: { [key: string]: string | number } = {}
	): Observable<{ total: number; citizenships: any[] }> {
		let params = new HttpParams();

		// Добавляем критерии поиска
		if (criteria && Object.keys(criteria).length > 0) {
			Object.keys(criteria).forEach((key) => {
				params = params.set(key, criteria[key].toString());
			});
		}

		return this.http.get<any>(`${this.baseApiUrl}/searchCitizenships/search`, { params }).pipe(
			map((response) => {
				// Парсим ответ
				const citizenships = response.citizenships || [];
				return {
					total: citizenships.length,
					citizenships,
				};
			}),
			catchError((error) => {
				console.error('[searchCitizenships] Ошибка:', error);
				return of({ total: 0, citizenships: [] });
			})
		);
	}
}
