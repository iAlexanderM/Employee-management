import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Contractor } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorWatchService {
	private apiUrl = 'http://localhost:8080/api';

	constructor(private http: HttpClient) { }

	getContractors(params: { page: number; pageSize: number }): Observable<any> {
		let httpParams = new HttpParams()
			.set('page', params.page)
			.set('pageSize', params.pageSize);

		return this.http.get('/api/contractors', { params: httpParams }).pipe(
			catchError(error => {
				console.error('Ошибка при получении контрагентов:', error);
				return of({ contractors: [], total: 0 }); // Возвращаем пустые данные в случае ошибки
			})
		);
	}

	searchContractors(params: any): Observable<{ contractors: Contractor[]; total: number }> {
		const httpParams = new HttpParams({ fromObject: params });
		return this.http.get<any>(`${this.apiUrl}/searchcontractors/search`, { params: httpParams }).pipe(
			map(response => {
				if (Array.isArray(response)) {
					// Сервер возвращает просто массив контрагентов
					return { contractors: response, total: response.length };
				} else if (response && Array.isArray(response.contractors)) {
					// Сервер возвращает объект с полями contractors и total
					return { contractors: response.contractors, total: response.total || response.contractors.length };
				} else {
					// Неизвестный формат ответа
					console.error('Неизвестный формат ответа при поиске:', response);
					return { contractors: [], total: 0 };
				}
			}),
			catchError(error => {
				console.error('Ошибка поиска:', error);
				return of({ contractors: [], total: 0 });
			})
		);
	}

	getContractorById(id: string): Observable<Contractor> {
		return this.http.get<Contractor>(`/api/contractors/${id}`);
	}

	archiveContractor(id: string): Observable<void> {
		return this.http.post<void>(`/contractors/${id}/archive`, {});
	}
}
