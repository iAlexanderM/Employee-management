import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pass } from '../models/pass.model';

@Injectable({
	providedIn: 'root'
})
export class PassService {
	private apiUrl = 'http://localhost:8080/api/Pass';

	constructor(private http: HttpClient) { }

	/**
	 * Получить список пропусков с фильтром по статусу печати.
	 * @param printed Статус печати (true/false).
	 */
	getPasses(printed?: boolean): Observable<Pass[]> {
		let params = new HttpParams();
		if (printed !== undefined) {
			params = params.set('printed', printed.toString());
		}
		return this.http.get<Pass[]>(this.apiUrl, { params });
	}

	/**
	 * Печать пропуска.
	 * @param id ID пропуска.
	 */
	printPass(id: number): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/${id}/print`, {});
	}
}
