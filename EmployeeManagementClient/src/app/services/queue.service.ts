import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Этот сервис содержит методы для обоих сценариев:
 * 1) «Классический» (current-token, active-token, pending-tokens, close-token, activate-token).
 * 2) «JWT-подход» (getNextSignedToken, saveTransaction).
 */
@Injectable({
	providedIn: 'root',
})
export class QueueService {
	private apiUrl = 'http://localhost:8080/api/Queue';

	constructor(private http: HttpClient) { }

	// -----------------------------------------------------------------------
	// 1) КЛАССИЧЕСКИЕ МЕТОДЫ
	// -----------------------------------------------------------------------

	/**
	 * Получить текущий номер талона.
	 * @param type Тип талона (например, 'P').
	 */
	getCurrentToken(type: string): Observable<{ currentToken: string }> {
		return this.http.get<{ currentToken: string }>(
			`${this.apiUrl}/current-token/${type}`
		);
	}

	/**
	 * Получить активный талон.
	 */
	getActiveToken(): Observable<{ ActiveToken: string | null }> {
		return this.http.get<{ ActiveToken: string | null }>(
			`${this.apiUrl}/active-token`
		);
	}

	/**
	 * Получить список ожидающих талонов.
	 */
	getPendingTokens(): Observable<Array<{ token: string; createdAt: string }>> {
		return this.http.get<Array<{ token: string; createdAt: string }>>(
			`${this.apiUrl}/pending-tokens`
		);
	}

	/**
	 * Закрыть талон.
	 * @param token Талон для закрытия.
	 */
	closeToken(token: string): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/close-token`, { token });
	}

	/**
	 * Активировать талон.
	 * @param token Талон для активации.
	 */
	activateToken(token: string): Observable<void> {
		return this.http.post<void>(`${this.apiUrl}/activate-token`, { token });
	}

	// -----------------------------------------------------------------------
	// 2) JWT-ПОДХОД
	// -----------------------------------------------------------------------

	/**
	 * Получить подписанный токен.
	 * @param type Тип талона (например, 'P').
	 */
	getNextSignedToken(type: string): Observable<{ signedToken: string }> {
		return this.http.get<{ signedToken: string }>(
			`${this.apiUrl}/new-token/${type}`
		);
	}

	/**
	 * Сохранить транзакцию через JWT-подход.
	 * @param dto Данные транзакции.
	 */
	saveTransaction(dto: SaveTransactionJwtDto): Observable<SaveTransactionResponse> {
		return this.http.post<SaveTransactionResponse>(
			`${this.apiUrl}/save-transaction`,
			dto
		);
	}

	/**
	 * Генерировать новый талон через классический подход.
	 * @param type Тип талона (например, 'P').
	 */
	generateNewToken(type: string): Observable<{ newToken: string }> {
		return this.http.get<{ newToken: string }>(
			`${this.apiUrl}/new-token/${type}`
		);
	}
}

/** DTO для сохранения транзакции (JWT-подход) */
export interface SaveTransactionJwtDto {
	signedToken: string;
	contractorId: number;
	storeId: number;
	passTypeId: number;
	startDate: string; // ISO формат даты
	endDate: string;   // ISO формат даты
	position?: string;
}

/** Ответ на saveTransaction */
export interface SaveTransactionResponse {
	message: string;
	transactionId: number;
	token: string;
}
