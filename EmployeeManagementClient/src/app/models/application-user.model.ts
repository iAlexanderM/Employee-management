import { PassTransaction } from './transaction.model';

export interface ApplicationUser {
	id: string;
	userName: string;
	email: string;
	firstName?: string;
	lastName?: string;
	middleName?: string;
	passTransactions?: PassTransaction[];
	roles?: string[];
}
