// src/app/components/queue/queue.component.ts
import { QueueService } from '../../services/queue.service';
import { PassTransaction } from '../../models/transaction.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-queue',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './queue.component.html',
	styleUrls: ['./queue.component.css']
})
export class QueueComponent {
	transactions: PassTransaction[] = [];
	createTransactionForm: FormGroup;
	selectedToken: string = '';

	constructor(
		private queueService: QueueService,
		private fb: FormBuilder
	) {
		this.createTransactionForm = this.fb.group({
			token: ['', Validators.required],
			contractorId: ['', Validators.required],
			storeId: ['', Validators.required],
			passTypeId: ['', Validators.required],
			startDate: ['', Validators.required],
			endDate: ['', Validators.required],
			position: ['']
		});
	}

	ngOnInit(): void {
		this.loadTransactions();
	}

	loadTransactions(): void {
		this.queueService.listAllTransactions().subscribe(
			(data) => {
				this.transactions = data;
			},
			(error) => {
				console.error('Ошибка при загрузке транзакций:', error);
			}
		);
	}

	onCreateTransaction(): void {
		if (this.createTransactionForm.invalid) {
			return;
		}

		const dto = this.createTransactionForm.value;

		this.queueService.createTransaction(dto).subscribe(
			(response) => {
				alert(response.message);
				this.createTransactionForm.reset();
				this.loadTransactions();
			},
			(error) => {
				console.error('Ошибка при создании транзакции:', error);
				alert('Не удалось создать транзакцию.');
			}
		);
	}

	onCloseToken(token: string): void {
		if (confirm(`Вы уверены, что хотите закрыть талон ${token}?`)) {
			this.queueService.closeToken(token).subscribe(
				(response) => {
					alert(response.message);
					this.loadTransactions();
				},
				(error) => {
					console.error('Ошибка при закрытии талона:', error);
					alert('Не удалось закрыть талон.');
				}
			);
		}
	}
}
