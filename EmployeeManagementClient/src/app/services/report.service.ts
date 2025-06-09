import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PassTypeDetail } from '../models/report.models';

interface PassType {
	id: number;
	name: string;
}

@Injectable({
	providedIn: 'root'
})
export class ReportService {
	private readonly reportApiBaseUrl = 'http://localhost:8080/api/report';
	private readonly passTypeApiBaseUrl = 'http://localhost:8080/api/passtype';
	private readonly nonPaginatedEndpoints = ['financial', 'passes-summary'];

	constructor(private http: HttpClient) { }

	downloadReport(endpoint: string, params: any): Observable<Blob> {
		const cleanParams = this.cleanParams(params);
		return this.http.get(`${this.reportApiBaseUrl}/${endpoint}`, {
			params: cleanParams,
			responseType: 'blob'
		});
	}

	getReportData(endpoint: string, params: any, page?: number, pageSize?: number): Observable<any> {
		const cleanParams = this.cleanParams({
			...params,
			...(this.nonPaginatedEndpoints.includes(endpoint) ? {} : { page: page?.toString(), pageSize: pageSize?.toString() })
		});
		console.log(`Requesting ${endpoint} with params:`, cleanParams);

		return this.http.get(`${this.reportApiBaseUrl}/${endpoint}-data`, { params: cleanParams }).pipe(
			map(response => {
				console.log(`Raw response for ${endpoint}:`, response);
				if (this.nonPaginatedEndpoints.includes(endpoint)) {
					return Array.isArray(response) ? response : [];
				}
				// Поддержка { totalCount, data } или { TotalCount, Data }
				const res = response as any;
				return {
					totalCount: res.totalCount ?? res.TotalCount ?? 0,
					data: res.data ?? res.Data ?? []
				};
			}),
			catchError(error => {
				console.error(`Ошибка при получении данных отчёта ${endpoint}:`, error);
				return of(this.nonPaginatedEndpoints.includes(endpoint) ? [] : { totalCount: 0, data: [] });
			})
		);
	}

	getSuggestions(fieldType: 'building' | 'floor' | 'line', query: string, context?: { building?: string | null, floor?: string | null }): Observable<string[]> {
		if (!query || query.trim().length < 1) {
			return of([]);
		}
		let params = new HttpParams().set('query', query.trim());
		if (fieldType === 'floor' && context?.building) {
			params = params.set('building', context.building);
		}
		if (fieldType === 'line') {
			if (context?.building) params = params.set('building', context.building);
			if (context?.floor) params = params.set('floor', context.floor);
		}

		return this.http.get<string[]>(`${this.reportApiBaseUrl}/suggestions/${fieldType}`, { params }).pipe(
			catchError(error => {
				console.error(`Ошибка при получении подсказок для ${fieldType}:`, error);
				if (error.status === 404) {
					console.warn(`Бэкенд не нашел эндпоинт: ${error.url}`);
				}
				return of([]);
			})
		);
	}

	getPassTypeSuggestions(nameQuery: string): Observable<string[]> {
		if (!nameQuery || nameQuery.trim().length < 1) {
			return of([]);
		}
		const params = new HttpParams().set('name', nameQuery.trim());
		return this.http.get<PassType[]>(`${this.passTypeApiBaseUrl}/search`, { params }).pipe(
			map(passTypes => passTypes.map(pt => pt.name)),
			catchError(error => {
				console.error(`Ошибка при получении подсказок для типа пропуска:`, error);
				return of([]);
			})
		);
	}

	getPassTypeDetails(queueType: string, dateParams: { startDate: string | null, endDate: string | null }): Observable<PassTypeDetail[]> {
		if (!dateParams.startDate || !dateParams.endDate) {
			console.error("Даты не выбраны для получения деталей.");
			return of([]);
		}

		let params = new HttpParams()
			.set('queueType', queueType)
			.set('startDate', dateParams.startDate)
			.set('endDate', dateParams.endDate);

		return this.http.get<PassTypeDetail[]>(`${this.reportApiBaseUrl}/passes-summary-details`, { params }).pipe(
			catchError(error => {
				console.error(`Ошибка при получении деталей для типа очереди ${queueType}:`, error);
				return of([]);
			})
		);
	}

	private cleanParams(params: any): any {
		const clean: any = {};
		for (const key in params) {
			if (params.hasOwnProperty(key) && params[key] !== null && params[key] !== undefined && params[key] !== '') {
				clean[key] = params[key];
			}
		}
		return clean;
	}
}