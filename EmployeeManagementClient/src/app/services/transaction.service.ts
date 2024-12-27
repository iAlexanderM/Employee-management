import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PassTransaction } from '../models/transaction.model';

@Injectable({
	providedIn: 'root'
})
export class TransactionService {
	private apiUrl = 'http://localhost:8080/api/PassTransaction';

	constructor(private http: HttpClient) { }

	/**
	 * Получить список транзакций с фильтром по статусу.
	 * @param status Статус транзакции (например, 'Pending', 'Paid').
	 */
	getTransactions(status?: string): Observable<PassTransaction[]> {
		let params = new HttpParams();
		if (status) {
			params = params.set('status', status);
		}
		return this.http.get<PassTransaction[]>(this.apiUrl, { params });
	}

	/**
	 * Получить транзакцию по её ID.
	 * @param id ID транзакции.
	 */
	getTransactionById(id: number): Observable<PassTransaction> {
		return this.http.get<PassTransaction>(`${this.apiUrl}/${id}`);
	}

	/**
	 * Создать новую транзакцию.
	 * @param data Данные для создания транзакции.
	 */
	createTransaction(data: Partial<PassTransaction>): Observable<PassTransaction> {
		return this.http.post<PassTransaction>(this.apiUrl, data);
	}

	/**
	 * Подтвердить оплату транзакции.
	 * @param id ID транзакции.
	 */
	confirmTransaction(id: number): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/${id}/confirm`, {});
	}
}
