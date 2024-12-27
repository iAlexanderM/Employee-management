import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../services/transaction.service';
import { PassTransaction } from '../../../models/pass-transaction.model';

@Component({
	selector: 'app-transaction-list',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './transaction-list.component.html',
	styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
	transactions: PassTransaction[] = [];
	statusFilter: string = 'Pending'; // по умолчанию Pending

	constructor(private transactionService: TransactionService) { }

	ngOnInit(): void {
		this.loadTransactions();
	}

	/**
	 * Загрузка транзакций с учетом фильтра.
	 */
	loadTransactions(): void {
		this.transactionService.getTransactions(this.statusFilter).subscribe(data => {
			this.transactions = data;
		}, error => {
			console.error('Ошибка при загрузке транзакций', error);
		});
	}

	/**
	 * Подтвердить оплату транзакции.
	 * @param id ID транзакции.
	 */
	confirmPayment(id: number): void {
		this.transactionService.confirmTransaction(id).subscribe(() => {
			this.loadTransactions();
		}, error => {
			console.error('Ошибка при подтверждении оплаты', error);
		});
	}

	/**
	 * Изменить фильтр статуса и перезагрузить транзакции.
	 * @param status Новый статус.
	 */
	changeStatusFilter(status: string): void {
		this.statusFilter = status;
		this.loadTransactions();
	}
}
