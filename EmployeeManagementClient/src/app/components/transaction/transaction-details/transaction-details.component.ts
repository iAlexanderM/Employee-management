import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { TransactionService } from '../../../services/transaction.service';
import { PassTransaction } from '../../../models/transaction.model';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { ApplicationUser } from '../../../models/application-user.model';

@Component({
	selector: 'app-transaction-details',
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatIconModule,
		MatButtonModule
	],
	templateUrl: './transaction-details.component.html',
	styleUrls: ['./transaction-details.component.css']
})
export class TransactionDetailsComponent implements OnInit {
	transaction: PassTransaction | null = null;
	transactionId: number = 0;
	errorMessage: string | null = null;

	allUsers: ApplicationUser[] = [];

	constructor(
		private route: ActivatedRoute,
		private transactionService: TransactionService,
		private router: Router,
		private authService: AuthService,
		private userService: UserService
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
				this.errorMessage = null;
			},
			error: (error) => {
				console.error('Ошибка при загрузке транзакции:', error);
				this.transaction = null;
				this.errorMessage = 'Ошибка при загрузке деталей транзакции. Пожалуйста, попробуйте еще раз.';
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
					this.errorMessage = 'Не удалось подтвердить оплату. Пожалуйста, попробуйте еще раз.';
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