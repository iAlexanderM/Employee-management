import { Pass } from './pass.model';
import { Contractor } from './contractor.model';
import { Store } from './store.model';
import { PassType } from './pass-type.model';
import { ApplicationUser } from './application-user.model';

export interface PassTransaction {
	id: number;
	token: string;
	tokenType: string;
	contractorId: number;
	contractor: Contractor;
	userId: string;
	user: ApplicationUser;
	storeId: number;
	store: Store;
	passTypeId: number;
	passType: PassType;
	startDate: Date;
	endDate: Date;
	amount: number;
	status: string;
	createdAt: Date;
	position: string;
	passId?: number; // Теперь опционально
	pass?: Pass; // Связь с Pass
}
