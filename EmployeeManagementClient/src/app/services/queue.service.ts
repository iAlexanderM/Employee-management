// src/app/services/queue.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueueToken } from '../models/queue.model';
import { PassTransaction } from '../models/transaction.model';

@Injectable({
	providedIn: 'root'
})
export class QueueService {
	private apiUrl = 'http://localhost:8080/api/Queue';

	constructor(private http: HttpClient) { }

	createToken(type: string): Observable<{ token: string }> {
		return this.http.post<{ token: string }>(`${this.apiUrl}/create-token?type=${type}`, {});
	}

	closeToken(token: string): Observable<{ message: string }> {
		return this.http.post<{ message: string }>(`${this.apiUrl}/close-token`, { token });
	}

	listAllTransactions(): Observable<PassTransaction[]> {
		return this.http.get<PassTransaction[]>(`${this.apiUrl}/list-all-transactions`);
	}

	createTransaction(dto: CreateTransactionDto): Observable<{ message: string; transactionId: number }> {
		return this.http.post<{ message: string; transactionId: number }>(`${this.apiUrl}/create-transaction`, dto);
	}
}

export interface CreateTransactionDto {
	token: string;
	contractorId: number;
	storeId: number;
	passTypeId: number;
	startDate: Date;
	endDate: Date;
	position?: string;
}
