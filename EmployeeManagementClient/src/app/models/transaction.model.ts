import { ApplicationUser } from "./application-user.model";
import { Store } from "./store.model";
import { PassType } from "./pass-type.model";

export interface PassTransaction {
	id: number;
	token: string;
	tokenType: string;
	userId: string;
	user?: ApplicationUser;
	contractorStorePasses: ContractorStorePass[];
	startDate: Date;
	endDate: Date;
	amount: number;
	status: string;
	createdAt: Date;
	position: string;
	passId?: number;
	paymentDate?: Date;
	passCount: number;
}

export interface ContractorStorePass {
	contractorId: number;
	contractor: ContractorDto;
	storeId: number;
	store: Store;
	passTypeId: number;
	passType: PassType;
	position?: string;
	originalPassId?: number;
}

export interface ContractorDto {
	id: number;
	lastName?: string;
	firstName?: string;
	middleName?: string;
	passportSerialNumber?: string;
}

export interface CreateTransactionDto {
	token: string;
	contractorStorePasses: ContractorStorePassCreateDto[];
	startDate: Date;
	endDate: Date;
	position?: string;
	originalPassId?: number;
}

export interface ContractorStorePassCreateDto {
	contractorId: number;
	storeId: number;
	passTypeId: number;
	position?: string;
	originalPassId?: number;
}