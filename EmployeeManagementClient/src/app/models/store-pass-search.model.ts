export interface PassDetailsDto {
	id: number;
	uniquePassId: string;
	passTypeId: number;
	passTypeName: string;
	passTypeColor: string;
	passTypeDurationInMonths: number;
	cost: number;
	startDate: string;
	endDate: string;
	transactionDate: string;
	contractorName: string;
	contractorId: number;
	isClosed: boolean;
	closeReason: string;
	passStatus: string;
	printStatus: string;
	contractorPhotoPath: string;
	position: string;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
}

export interface ContractorPassesDto {
	contractorId: number;
	contractorName: string;
	contractorPhotoPath: string;
	documentPhotos: string;
	phoneNumber: string;
	citizenship: string;
	productType: string;
	activePasses: PassDetailsDto[];
	closedPasses: PassDetailsDto[];
	allActivePasses: PassDetailsDto[];
}

export interface PassByStoreResponseDto {
	storeId: number;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	contractors: ContractorPassesDto[];
}