import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pass } from '../models/pass.model';
import { PassPrintQueueItem } from '../models/pass-print-queue.model';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class PassService {
	private baseApiUrl = environment.apiUrl || 'http://localhost:8080/api';
	private baseUrl = `${this.baseApiUrl}/Pass`;
	private searchBaseUrl = `${this.baseApiUrl}/PassByStore`;
	private suggestionsApiUrl = `${this.baseApiUrl}/suggestions`;

	constructor(private http: HttpClient) { }

	getAllPasses(): Observable<Pass[]> {
		return this.http.get<Pass[]>(this.baseUrl);
	}

	getPassById(id: number): Observable<Pass> {
		return this.http.get<Pass>(`${this.baseUrl}/${id}`);
	}

	getPrintQueue(page: number, pageSize: number, contractorId?: number): Observable<{ items: PassPrintQueueItem[], total: number }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());
		if (contractorId) {
			params = params.set('contractorId', contractorId.toString());
		}
		console.log('Параметры:', params.toString());
		return this.http.get<{ items: PassPrintQueueItem[], total: number }>(`${this.baseUrl}/print-queue`, { params });
	}

	getIssuedPasses(page: number, pageSize: number, contractorId?: number): Observable<{ items: PassPrintQueueItem[], total: number }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());

		if (contractorId) {
			params = params.set('contractorId', contractorId.toString());
		}

		return this.http.get<{ items: PassPrintQueueItem[], total: number }>(`${this.baseUrl}/issued`, { params });
	}

	issuePass(id: number): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/${id}/issue`, {});
	}

	closePass(id: number, closeReason: string): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/${id}/close`, { closeReason });
	}

	reopenPass(id: number): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/${id}/reopen`, {});
	}

	getPendingPassesByTransactionId(transactionId: number): Observable<Pass[]> {
		return this.http.get<Pass[]>(`${this.baseUrl}/by-transaction-id/${transactionId}/pending`);
	}

	getPassesByTransactionId(transactionId: number): Observable<Pass[]> {
		return this.http.get<Pass[]>(`${this.baseUrl}/by-transaction-id/${transactionId}`);
	}

	issuePassesByTransactionId(transactionId: number): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/issue-by-transaction-id/${transactionId}`, {});
	}

	searchPassesByStore(criteria: any): Observable<any[]> {
		let params = new HttpParams();
		for (const key in criteria) {
			if (criteria[key] !== null && criteria[key] !== undefined && criteria[key] !== '') {
				params = params.set(key, criteria[key].toString());
			}
		}
		return this.http.get<any[]>(`${this.searchBaseUrl}/search`, { params });
	}

	getBuildingSuggestions(query: string): Observable<string[]> {
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/buildings`, { params: { query } });
	}

	getFloorSuggestions(query: string): Observable<string[]> {
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/floors`, { params: { query } });
	}

	getLineSuggestions(query: string): Observable<string[]> {
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/lines`, { params: { query } });
	}

	getStoreNumberSuggestions(query: string): Observable<string[]> {
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/storeNumbers`, { params: { query } });
	}
}