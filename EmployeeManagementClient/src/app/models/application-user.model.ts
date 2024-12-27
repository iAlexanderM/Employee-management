import { PassTransaction } from './transaction.model';

export interface ApplicationUser {
	id: string;
	userName: string;
	email: string;
	// Добавьте другие свойства при необходимости
	passTransactions?: PassTransaction[]; // Навигационное свойство
}
