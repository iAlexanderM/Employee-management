import { User } from './pass.model';

export interface PassByStoreResponseDto {
	storeId: number;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	contractors?: ContractorPassesDto[];
	totalCount?: number;
}

export interface ContractorPassesDto {
	contractorId: number;
	contractorName?: string;
	lastName?: string;
	firstName?: string;
	middleName?: string;
	passportSerialNumber?: string;
	phoneNumber?: string;
	citizenship?: string;
	productType?: string;
	contractorPhotoPath: string | null;
	documentPhotos?: string;
	activePasses?: PassDetailsDto[];
	closedPasses?: PassDetailsDto[];
}

export interface PassDetailsDto {
	id: number; // Добавляем id для устранения TS2339
	uniquePassId: string; // Добавляем для нового функционала
	contractorId: number;
	storeId: number;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	passTypeId: number;
	passTypeName: string;
	passTypeColor?: string;
	passTypeDurationInMonths: number;
	cost: number;
	transactionDate: string;
	startDate: string;
	endDate: string;
	position?: string;
	isClosed: boolean;
	closedByUser?: User; // Добавляем для нового функционала
}

export interface Store {
	id: number;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	note?: string;
	isArchived: boolean;
}

export interface SearchCriteria {
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	showActive: boolean;
	showClosed: boolean;
	page: number;
	pageSize: number;
}