// src/app/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PassTransaction } from '../models/transaction.model';

@Injectable({
	providedIn: 'root'
})
export class TransactionService {
	// Используйте environment.apiUrl, например 'http://localhost:8080/api'
	private baseUrl = `${environment.apiUrl}/PassTransaction`;

	constructor(private http: HttpClient) { }

	// Метод создания транзакции
	createTransaction(transactionData: any): Observable<{ message: string; transactionId: number }> {
		return this.http.post<{ message: string; transactionId: number }>(`${this.baseUrl}/create`, transactionData);
	}

	// Метод поиска транзакций с пагинацией и фильтрами
	searchTransactions(searchDto: any, page: number, pageSize: number): Observable<{ total: number, transactions: PassTransaction[] }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		// Если searchDto содержит дополнительные фильтры, добавляем их в параметры
		// Например: если фильтруется по токену или дате создания
		Object.keys(searchDto).forEach(key => {
			if (searchDto[key] !== null && searchDto[key] !== undefined && searchDto[key] !== '') {
				params = params.set(key, searchDto[key]);
			}
		});

		return this.http.get<{ total: number, transactions: PassTransaction[] }>(`${this.baseUrl}/search`, { params });
	}

	getTransactionById(id: number): Observable<PassTransaction> {
		return this.http.get<PassTransaction>(`${this.baseUrl}/${id}`);
	}

	confirmTransaction(id: number): Observable<{ message: string }> {
		return this.http.post<{ message: string }>(`${this.baseUrl}/${id}/confirm`, {});
	}

	updatePendingTransaction(id: number, dto: UpdatePendingDto): Observable<{ message: string }> {
		return this.http.put<{ message: string }>(`${this.baseUrl}/${id}/update`, dto);
	}
}

// DTO для обновления (если требуется)
export interface UpdatePendingDto {
	contractorId: number;
	storeId: number;
	passTypeId: number;
	startDate: Date;
	endDate: Date;
	position?: string;
}
