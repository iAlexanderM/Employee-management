import { PassTransaction } from './transaction.model';
import { PassType } from './pass-type.model';
import { Contractor } from './contractor.model';
import { Store } from './store.model';

export interface Pass {
	id: number;
	uniquePassId: string;
	passTypeId: number;
	passType: PassType;
	contractorId: number;
	contractor: Contractor;
	storeId: number;
	store: Store;
	startDate: Date;
	endDate: Date;
	transactionDate: Date;
	isClosed: boolean;
	closeReason?: string;
	mainPhotoPath?: string;
	position: string;
	passTransaction?: PassTransaction; // Связь с PassTransaction
}
