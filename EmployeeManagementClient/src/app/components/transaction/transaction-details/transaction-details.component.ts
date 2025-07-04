import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { PassTransaction } from '../../../models/transaction.model';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

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
		private transactionService: TransactionService,
		private router: Router,
		private authService: AuthService
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			this.transactionId = +params['id'];
			this.loadTransaction();
		});
	}

	loadTransaction(): void {
		this.transactionService.getTransactionById(this.transactionId).subscribe({
			next: (data) => {
				this.transaction = data;
			},
			error: (error) => {
				console.error('Ошибка при загрузке транзакции:', error);
				this.transaction = null;
			}
		});
	}

	confirmPayment(): void {
		if (this.transaction && confirm(`Вы уверены, что хотите подтвердить оплату транзакции ${this.transaction.token}?`)) {
			this.transactionService.confirmTransaction(this.transactionId).subscribe({
				next: (response) => {
					alert(response.message);
					this.loadTransaction();
				},
				error: (error) => {
					console.error('Ошибка при подтверждении оплаты:', error);
					alert('Не удалось подтвердить оплату.');
				}
			});
		}
	}

	hasRole(role: string): boolean {
		return this.authService.hasRole(role);
	}

	goBack(): void {
		this.router.navigate(['/transactions']);
	}
}