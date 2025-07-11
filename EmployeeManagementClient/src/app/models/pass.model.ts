import { PassTransaction } from './transaction.model';
import { PassType } from './pass-type.model';
import { Store } from './store.model';
import { Contractor, Photo } from './contractor.model';

export interface User {
	id: string;
	userName: string;
	email?: string;
}
export interface Pass {
	id: number;
	uniquePassId: string;
	passTypeId: number;
	passType?: PassType;
	passTypeName: string;
	contractorId: number;
	contractor?: Contractor;
	cost: number;
	storeId: number;
	store?: Store;
	storeFullName?: string;
	startDate: Date;
	endDate: Date;
	transactionDate: Date;
	isClosed: boolean;
	closeReason?: string;
	closeDate?: Date;
	closedBy?: string;
	closedByUserId?: string;
	closedByUser?: User;
	passStatus?: string;
	mainPhotoPath?: string;
	position: string;
	passTransaction?: PassTransaction;
	printStatus?: string;
	status: string;
	note?: string;
	building?: string;
	floor?: string;
	line?: string;
	storeNumber?: string;
}