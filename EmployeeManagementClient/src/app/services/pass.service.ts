import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Pass } from '../models/pass.model';
import { PassPrintQueueItem } from '../models/pass-print-queue.model';
import { PassByStoreResponseDto, ContractorPassesDto, PassDetailsDto } from '../models/store-pass-search.model';
import { UserService } from './user.service';

@Injectable({
	providedIn: 'root'
})
export class PassService {
	private baseApiUrl = environment.apiUrl || 'http://localhost:8080/api';
	private baseUrl = `${this.baseApiUrl}/Pass`;
	private searchBaseUrl = `${this.baseApiUrl}/PassByStore`;
	private suggestionsApiUrl = `${this.baseApiUrl}/suggestions`;

	constructor(private http: HttpClient, private userService: UserService) { }

	private getAuthHeaders(): HttpHeaders {
		const token = this.userService.getToken();
		return new HttpHeaders({
			Authorization: token ? `Bearer ${token}` : '',
			'Content-Type': 'application/json'
		});
	}

	getAllPasses(): Observable<Pass[]> {
		return this.http.get<Pass[]>(this.baseUrl, { headers: this.getAuthHeaders() });
	}

	getPassById(id: number): Observable<Pass> {
		return this.http.get<Pass>(`${this.baseUrl}/${id}`, { headers: this.getAuthHeaders() }).pipe(
			catchError(err => throwError(() => new Error(err.message || 'Не удалось получить пропуск')))
		);
	}

	getPrintQueue(page: number, pageSize: number, contractorId?: number): Observable<{ items: PassPrintQueueItem[], total: number }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());
		if (contractorId) {
			params = params.set('contractorId', contractorId.toString());
		}
		return this.http.get<{ items: PassPrintQueueItem[], total: number }>(`${this.baseUrl}/print-queue`, { params, headers: this.getAuthHeaders() });
	}

	getIssuedPasses(page: number, pageSize: number, contractorId?: number): Observable<{ items: PassPrintQueueItem[], total: number }> {
		let params = new HttpParams()
			.set('page', page.toString())
			.set('pageSize', pageSize.toString());
		if (contractorId) {
			params = params.set('contractorId', contractorId.toString());
		}
		return this.http.get<{ items: PassPrintQueueItem[], total: number }>(`${this.baseUrl}/issued`, { params, headers: this.getAuthHeaders() });
	}

	issuePass(id: number): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/${id}/issue`, {}, { headers: this.getAuthHeaders() });
	}

	closePass(passId: number, reason: string, closedBy: string): Observable<any> {
		const headers = this.getAuthHeaders();
		const body = { closeReason: reason, closedBy };
		return this.http.post(`${this.baseUrl}/${passId}/close`, body, { headers }).pipe(
			catchError(err => throwError(() => err))
		);
	}

	reopenPass(id: number): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/${id}/reopen`, {}, { headers: this.getAuthHeaders() });
	}

	getPendingPassesByTransactionId(transactionId: number): Observable<Pass[]> {
		return this.http.get<Pass[]>(`${this.baseUrl}/by-transaction-id/${transactionId}/pending`, { headers: this.getAuthHeaders() });
	}

	getPassesByTransactionId(transactionId: number): Observable<Pass[]> {
		return this.http.get<Pass[]>(`${this.baseUrl}/by-transaction-id/${transactionId}`, { headers: this.getAuthHeaders() });
	}

	issuePassesByTransactionId(transactionId: number): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/issue-by-transaction-id/${transactionId}`, {}, { headers: this.getAuthHeaders() });
	}

	searchPassesByStore(criteria: {
		building: string;
		floor: string;
		line: string;
		storeNumber: string;
		showActive?: boolean;
		showClosed?: boolean;
		page?: number;
		pageSize?: number;
		isArchived?: boolean;
	}): Observable<PassByStoreResponseDto[]> {
		let params = new HttpParams();
		const validKeys: (keyof typeof criteria)[] = [
			'building',
			'floor',
			'line',
			'storeNumber',
			'showActive',
			'showClosed',
			'page',
			'pageSize',
			'isArchived'
		];

		for (const key of validKeys) {
			if (criteria[key] !== null && criteria[key] !== undefined && criteria[key] !== '') {
				params = params.set(key, criteria[key].toString());
			}
		}

		return this.http.get<PassByStoreResponseDto[]>(`${this.searchBaseUrl}/search`, { params, headers: this.getAuthHeaders() }).pipe(
			catchError(err => {
				console.error('Ошибка при поиске пропусков:', err);
				return throwError(() => new Error(err.error?.message || 'Ошибка при поиске пропусков'));
			})
		);
	}

	getContractorActivePasses(contractorId: number): Observable<PassDetailsDto[]> {
		return this.http.get<PassDetailsDto[]>(`${this.baseUrl}/contractor/${contractorId}/active`, { headers: this.getAuthHeaders() }).pipe(
			catchError(err => {
				console.error('Ошибка при получении активных пропусков контрагента:', err);
				return of([]);
			})
		);
	}

	getBuildingSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/buildings`, { params, headers: this.getAuthHeaders() }).pipe(
			catchError(() => of([]))
		);
	}

	getFloorSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/floors`, { params, headers: this.getAuthHeaders() }).pipe(
			catchError(() => of([]))
		);
	}

	getLineSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/lines`, { params, headers: this.getAuthHeaders() }).pipe(
			catchError(() => of([]))
		);
	}

	getStoreNumberSuggestions(query: string, isArchived: boolean = false): Observable<string[]> {
		const params = new HttpParams()
			.set('query', query)
			.set('isArchived', isArchived.toString());
		return this.http.get<string[]>(`${this.suggestionsApiUrl}/storeNumbers`, { params, headers: this.getAuthHeaders() }).pipe(
			catchError(() => of([]))
		);
	}
}