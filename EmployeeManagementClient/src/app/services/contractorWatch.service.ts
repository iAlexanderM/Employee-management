import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Contractor } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorWatchService {

	constructor(private http: HttpClient) { }

	getContractors(): Observable<Contractor[]> {
		return this.http.get<{ $values: Contractor[] }>('/api/contractors').pipe(
			map(response => response.$values || []),
			catchError(error => {
				console.error('Ошибка при получении контрагентов:', error);
				return of([]); // Возвращаем пустой массив в случае ошибки.
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
