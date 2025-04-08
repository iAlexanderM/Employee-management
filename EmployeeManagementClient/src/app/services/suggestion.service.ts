// src/app/services/suggestion.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { ContractorDto } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class SuggestionService {
	private baseUrl = `${environment.apiUrl}/suggestions`;
	private storeCache = new Map<string, string[]>();
	private contractorCache = new Map<string, ContractorDto[]>(); // Изменено на ContractorDto[]

	constructor(private http: HttpClient) { }

	// Функция для нормализации ключа кеша
	private normalizeQuery(query: string): string {
		return query.trim().toLowerCase();
	}

	getContractorSuggestions(query: string): Observable<ContractorDto[]> { // Изменен тип возвращаемого значения
		const normalizedQuery = this.normalizeQuery(query);
		if (!normalizedQuery) {
			return of([]);
		}
		if (this.contractorCache.has(normalizedQuery)) {
			return of(this.contractorCache.get(normalizedQuery)!);
		}
		const params = new HttpParams().set('query', query);
		return this.http.get<ContractorDto[]>(`${this.baseUrl}/contractors`, { params }).pipe(
			tap(results => this.contractorCache.set(normalizedQuery, results))
		);
	}

	getStoreSuggestions(query: string): Observable<string[]> {
		const normalizedQuery = this.normalizeQuery(query);
		if (!normalizedQuery) {
			console.log('Empty query');
			return of([]);
		}
		if (this.storeCache.has(normalizedQuery)) {
			console.log('From cache:', this.storeCache.get(normalizedQuery));
			return of(this.storeCache.get(normalizedQuery)!);
		}
		const params = new HttpParams().set('query', query);
		return this.http.get<string[]>(`${this.baseUrl}/stores`, { params }).pipe(
			tap(results => {
				console.log('From API:', results);
				this.storeCache.set(normalizedQuery, results);
			}),
			catchError(err => {
				console.error('Error fetching stores:', err);
				return of([]);
			})
		);
	}
}
