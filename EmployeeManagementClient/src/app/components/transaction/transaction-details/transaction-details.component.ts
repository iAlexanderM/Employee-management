// src/app/components/transaction/transaction-details/transaction-details.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { PassTransaction } from '../../../models/transaction.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-transaction-details',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './transaction-details.component.html',
	styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent implements OnInit {
	transaction: PassTransaction | null = null;
	transactionId: number = 0;

	constructor(
		private route: ActivatedRoute,
		private transactionService: TransactionService
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.transactionId = +params['id'];
			this.loadTransaction();
		});
	}

	loadTransaction(): void {
		this.transactionService.getTransactionById(this.transactionId).subscribe(
			(data) => {
				this.transaction = data;
			},
			(error) => {
				console.error('Ошибка при загрузке транзакции:', error);
			}
		);
	}

	confirmPayment(): void {
		if (confirm(`Вы уверены, что хотите подтвердить оплату транзакции ${this.transaction?.token}?`)) {
			this.transactionService.confirmTransaction(this.transactionId).subscribe(
				(response) => {
					alert(response.message);
					this.loadTransaction();
				},
				(error) => {
					console.error('Ошибка при подтверждении оплаты:', error);
					alert('Не удалось подтвердить оплату.');
				}
			);
		}
	}

	updateTransaction(): void {
		// Реализуйте логику обновления транзакции
	}
}
