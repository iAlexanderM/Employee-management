import { PassTransaction } from './transaction.model';

export interface ApplicationUser {
	id: string;
	userName: string;
	email: string;
	passTransactions?: PassTransaction[];
}
