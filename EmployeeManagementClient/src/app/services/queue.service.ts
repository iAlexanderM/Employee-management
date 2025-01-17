// src/app/services/queue.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { QueueToken } from '../models/queue.model';
import { CreateTransactionDto } from '../models/create-transaction.dto';

@Injectable({
	providedIn: 'root'
})
export class QueueService {
	private baseUrl = `${environment.apiUrl}/Queue`;

	constructor(private http: HttpClient) { }

	/**
	 * Создать талон: POST /api/Queue/create-token?type=P
	 */
	createToken(type: string): Observable<{ token: string }> {
		return this.http.post<{ token: string }>(
			`${this.baseUrl}/create-token?type=${type}`,
			{}
		);
	}

	/**
	 * Закрыть талон: POST /api/Queue/close-token
	 */
	closeToken(token: string): Observable<{ message: string }> {
		return this.http.post<{ message: string }>(
			`${this.baseUrl}/close-token`,
			{ token }
		);
	}

	/**
	 * Список всех талонов: GET /api/Queue/list-all-tokens
	 */
	listAllTokens(page: number = 1, pageSize: number = 25): Observable<{ total: number; tokens: QueueToken[] }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());
		return this.http.get<{ total: number; tokens: QueueToken[] }>(`${this.baseUrl}/list-all-tokens`, { params });
	}
}
