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
	styleUrls: ['./transaction-details.component.css'],
})
export class TransactionDetailsComponent implements OnInit {
	transactionId: number | null = null;
	transaction?: PassTransaction;

	constructor(private route: ActivatedRoute, private transactionService: TransactionService) {
		const idParam = this.route.snapshot.paramMap.get('id');
		this.transactionId = idParam ? Number(idParam) : null;
	}

	ngOnInit(): void {
		if (this.transactionId !== null) {
			this.transactionService.getTransactionById(this.transactionId).subscribe(
				data => this.transaction = data,
				error => console.error('Ошибка при загрузке транзакции', error)
			);
		}
	}
}
