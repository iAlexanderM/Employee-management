import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PassTransaction, CreateTransactionDto, ContractorDto, Store, PassType } from '../models/transaction.model';

@Injectable({
	providedIn: 'root'
})
export class TransactionService {
	private baseUrl = `${environment.apiUrl}`;

	constructor(private http: HttpClient) { }

	createTransaction(data: CreateTransactionDto): Observable<any> {
		console.log('Sending transaction to server:', JSON.stringify(data, null, 2));
		return this.http.post<any>(`${this.baseUrl}/PassTransaction/create`, data);
	}

	searchTransactions(searchDto: any, page: number, pageSize: number): Observable<{ total: number, transactions: PassTransaction[] }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		const adjustedSearchDto = {
			...searchDto,
			contractorName: searchDto.contractorName || undefined,
			userName: searchDto.userName || undefined,
			storeSearch: searchDto.storeSearch || undefined,
			contractorId: searchDto.contractorId || undefined
		};

		Object.keys(adjustedSearchDto).forEach(key => {
			const value = adjustedSearchDto[key];
			if (value !== null && value !== undefined && value !== '') {
				params = params.set(key, value.toString());
			}
		});

		console.log('Search params:', params.toString());
		return this.http.get<{ total: number, transactions: PassTransaction[] }>(`${this.baseUrl}/PassTransaction/search`, { params });
	}

	getTransactionById(id: number): Observable<PassTransaction> {
		return this.http.get<PassTransaction>(`${this.baseUrl}/PassTransaction/${id}`);
	}

	confirmTransaction(id: number): Observable<{ message: string }> {
		return this.http.post<{ message: string }>(`${this.baseUrl}/PassTransaction/${id}/confirm`, {});
	}

	updatePendingTransaction(id: number, dto: CreateTransactionDto): Observable<{ message: string }> {
		return this.http.put<{ message: string }>(`${this.baseUrl}/PassTransaction/${id}/update`, dto);
	}

	getUniqueUserNames(): Observable<string[]> {
		return this.http.get<string[]>(`${this.baseUrl}/PassTransaction/unique-usernames`);
	}

	getContractorById(id: number): Observable<ContractorDto> {
		return this.http.get<ContractorDto>(`${this.baseUrl}/Contractors/${id}`);
	}

	getStoreByDetails(building: string, floor: string, line: string, storeNumber: string): Observable<Store> {
		let params = new HttpParams()
			.set('building', building)
			.set('floor', floor)
			.set('line', line)
			.set('storeNumber', storeNumber)
			.set('page', '1')
			.set('pageSize', '1');

		return this.http.get<{ total: number, stores: Store[] }>(`${this.baseUrl}/Store`, { params })
			.pipe(
				map(response => {
					if (response.stores && response.stores.length > 0) {
						return response.stores[0];
					}
					throw new Error('Магазин не найден');
				})
			);
	}

	getPassTypeById(id: number): Observable<PassType> {
		return this.http.get<PassType>(`${this.baseUrl}/passType/${id}`);
	}
}