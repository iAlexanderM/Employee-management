import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../services/transaction.service';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { StoreService } from '../../../services/store.service';
import { PassGroupTypeService } from '../../../services/pass-group-type.service';
import { Router } from '@angular/router';
import { Contractor } from '../../../models/contractor.model';
import { Store } from '../../../models/store.model';
import { PassType } from '../../../models/pass-type.model';

@Component({
	selector: 'app-transaction-create',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './transaction-create.component.html',
	styleUrls: ['./transaction-create.component.css']
})
export class TransactionCreateComponent implements OnInit {
	contractors: Contractor[] = [];
	stores: Store[] = [];
	passTypes: PassType[] = [];

	contractorId!: number;
	storeId!: number;
	passTypeId!: number;
	startDate!: string;
	endDate!: string;
	amount!: number;
	position!: string; // Новое поле

	constructor(
		private transactionService: TransactionService,
		private contractorService: ContractorWatchService,
		private storeService: StoreService,
		private passGroupTypeService: PassGroupTypeService,
		private router: Router
	) { }

	ngOnInit(): void {
		this.contractorService.getContractors().subscribe(
			data => this.contractors = data,
			error => console.error('Ошибка при загрузке контрагентов', error)
		);
		this.storeService.getStores().subscribe(
			data => this.stores = data,
			error => console.error('Ошибка при загрузке торговых точек', error)
		);
		this.passGroupTypeService.getPassTypes().subscribe(
			data => this.passTypes = data,
			error => console.error('Ошибка при загрузке типов пропусков', error)
		);
	}

	/**
	 * Создать новую транзакцию.
	 */
	createTransaction(): void {
		const transactionData = {
			contractorId: this.contractorId,
			storeId: this.storeId,
			passTypeId: this.passTypeId,
			startDate: this.startDate,
			endDate: this.endDate,
			amount: this.amount,
			position: this.position // Новое поле
		};

		this.transactionService.createTransaction(transactionData).subscribe(() => {
			this.router.navigate(['/transactions']);
		}, error => {
			console.error('Ошибка при создании транзакции', error);
		});
	}
}
