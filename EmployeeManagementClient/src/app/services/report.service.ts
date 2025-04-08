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

	constructor(private http: HttpClient) { }

	downloadReport(endpoint: string, params: any): Observable<Blob> {
		const cleanParams = this.cleanParams(params);
		return this.http.get(`${this.reportApiBaseUrl}/${endpoint}`, { // Используем reportApiBaseUrl
			params: cleanParams,
			responseType: 'blob'
		});
	}

	getReportData(endpoint: string, params: any): Observable<any> {
		const cleanParams = this.cleanParams(params);
		return this.http.get(`${this.reportApiBaseUrl}/${endpoint}-data`, { params: cleanParams }); // Используем reportApiBaseUrl
	}

	getSuggestions(fieldType: 'building' | 'floor' | 'line', query: string, context?: { building?: string | null, floor?: string | null }): Observable<string[]> {
		if (!query || query.trim().length < 1) {
			return of([]);
		}
		let params = new HttpParams().set('query', query.trim());
		// ... (добавление context) ...
		if (fieldType === 'floor' && context?.building) {
			params = params.set('building', context.building);
		}
		if (fieldType === 'line') {
			if (context?.building) params = params.set('building', context.building);
			if (context?.floor) params = params.set('floor', context.floor);
		}

		return this.http.get<string[]>(`${this.reportApiBaseUrl}/suggestions/${fieldType}`, { params }) // Используем reportApiBaseUrl
			.pipe(
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
		return this.http.get<PassType[]>(`${this.passTypeApiBaseUrl}/search`, { params })
			.pipe(
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
			return of([]); // Возвращаем пустой массив, если даты не заданы
		}

		let params = new HttpParams()
			.set('queueType', queueType)
			.set('startDate', dateParams.startDate)
			.set('endDate', dateParams.endDate);

		// Обращаемся к новому эндпоинту на бэкенде
		return this.http.get<PassTypeDetail[]>(`${this.reportApiBaseUrl}/passes-summary-details`, { params })
			.pipe(
				catchError(error => {
					console.error(`Ошибка при получении деталей для типа очереди ${queueType}:`, error);
					return of([]); // Возвращаем пустой массив в случае ошибки
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