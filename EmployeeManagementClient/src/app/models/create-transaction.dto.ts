export interface CreateTransactionDto {
	token: string;
	contractorId: number;
	storeId: number;
	passTypeId: number;
	startDate: Date;
	endDate: Date;
	position?: string;
}