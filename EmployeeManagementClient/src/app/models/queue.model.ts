/**
 * DTO для сохранения транзакции через JWT-подход.
 */
export interface SaveTransactionJwtDto {
	signedToken: string;
	contractorId: number;
	storeId: number;
	passTypeId: number;
	startDate: string; // ISO формат даты
	endDate: string;   // ISO формат даты
	position?: string;
}

/**
 * Ответ от сервера после сохранения транзакции.
 */
export interface SaveTransactionResponse {
	message: string;
	transactionId: number;
	token: string;
}
