import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Contractor, ContractorDto } from '../models/contractor.model';

@Injectable({
	providedIn: 'root',
})
export class ContractorWatchService {
	private apiUrl = 'http://localhost:8080/api/contractors';
	private searchApiUrl = 'http://localhost:8080/api/SearchContractors';

	constructor(private http: HttpClient) { }

	getContractors(params: { Page: number; PageSize: number; IsArchived?: boolean }): Observable<{ Contractors: Contractor[]; Total: number }> {
		let httpParams = new HttpParams()
			.set('page', params.Page.toString())
			.set('pageSize', params.PageSize.toString());

		if (params.IsArchived !== undefined) {
			httpParams = httpParams.set('isArchived', params.IsArchived.toString());
		}

		return this.http.get<{ contractors: Contractor[]; total: number }>(this.apiUrl, { params: httpParams }).pipe(
			map((response) => ({
				Contractors: response.contractors,
				Total: response.total,
			})),
			catchError((error) => {
				console.error('Ошибка при получении контрагентов:', error);
				return of({ Contractors: [], Total: 0 });
			})
		);
	}

	searchContractors(filters: { [key: string]: any }): Observable<{ Contractors: Contractor[]; Total: number }> {
		let params = new HttpParams();
		Object.keys(filters).forEach((key) => {
			if (filters[key] !== undefined && filters[key] !== null) {
				params = params.set(key, filters[key].toString());
			}
		});

		return this.http.get<{ contractors: Contractor[]; total: number }>(`${this.searchApiUrl}`, { params }).pipe(
			map((response) => ({
				Contractors: response.contractors,
				Total: response.total,
			})),
			catchError((error) => {
				console.error('Ошибка при поиске контрагентов:', error);
				return of({ Contractors: [], Total: 0 });
			})
		);
	}

	getContractor(id: string): Observable<ContractorDto> {
		return this.http.get<ContractorDto>(`${this.apiUrl}/${id}`).pipe(
			catchError((error) => {
				console.error('Ошибка при получении контрагента:', error);
				throw error;
			})
		);
	}

	archiveContractor(id: number): Observable<void> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json',
		});
		return this.http.put<void>(`${this.apiUrl}/${id}/archive`, { isArchived: true }, { headers }).pipe(
			catchError((error) => {
				console.error('Ошибка при архивировании контрагента:', error);
				const errorMessage = error.error?.message || error.message || 'Неизвестная ошибка при архивировании';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	unarchiveContractor(id: number): Observable<void> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json',
		});
		return this.http.put<void>(`${this.apiUrl}/${id}/unarchive`, {}, { headers }).pipe(
			catchError((error) => {
				console.error('Ошибка при разархивировании контрагента:', error);
				const errorMessage = error.error?.message || error.message || 'Неизвестная ошибка при разархивировании';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	updateContractor(id: string, contractor: Partial<Contractor>): Observable<Contractor> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json',
		});
		return this.http.put<Contractor>(`${this.apiUrl}/${id}`, contractor, { headers }).pipe(
			catchError((error) => {
				console.error('Ошибка при обновлении контрагента:', error);
				const errorMessage = error.error?.message || error.message || 'Неизвестная ошибка при обновлении';
				return throwError(() => new Error(errorMessage));
			})
		);
	}

	updateNote(id: string, note: string): Observable<void> {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${localStorage.getItem('token')}`,
			'Content-Type': 'application/json',
		});
		return this.http.put<void>(`${this.apiUrl}/${id}/note`, { note }, { headers }).pipe(
			catchError((error) => {
				console.error('Ошибка при обновлении заметки:', error);
				const errorMessage = error.error?.message || error.message || 'Неизвестная ошибка при обновлении заметки';
				return throwError(() => new Error(errorMessage));
			})
		);
	}
}