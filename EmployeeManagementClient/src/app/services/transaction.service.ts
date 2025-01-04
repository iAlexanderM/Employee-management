// src/app/services/transaction.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PassTransaction } from '../models/transaction.model';

@Injectable({
	providedIn: 'root'
})
export class TransactionService {
	private apiUrl = 'http://localhost:8080/api/PassTransaction';

	constructor(private http: HttpClient) { }

	getAllTransactions(): Observable<PassTransaction[]> {
		return this.http.get<PassTransaction[]>(this.apiUrl);
	}

	getTransactionById(id: number): Observable<PassTransaction> {
		return this.http.get<PassTransaction>(`${this.apiUrl}/${id}`);
	}

	confirmTransaction(id: number): Observable<any> {
		return this.http.post<any>(`${this.apiUrl}/${id}/confirm`, {});
	}

	updatePendingTransaction(id: number, dto: UpdatePendingDto): Observable<{ message: string }> {
		return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/update`, dto);
	}
}

export interface UpdatePendingDto {
	contractorId: number;
	storeId: number;
	passTypeId: number;
	startDate: Date;
	endDate: Date;
	position?: string;
}
