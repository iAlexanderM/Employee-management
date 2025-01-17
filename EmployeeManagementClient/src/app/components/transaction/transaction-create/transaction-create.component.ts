// src/app/components/transaction/transaction-create/transaction-create.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './transaction-create.component.html',
	styleUrls: ['./transaction-create.component.css']
})
export class TransactionCreateComponent implements OnInit {
	transactionForm!: FormGroup;
	contractors: Contractor[] = [];
	stores: Store[] = [];
	passTypes: PassType[] = [];

	constructor(
		private fb: FormBuilder,
		private transactionService: TransactionService,
		private contractorService: ContractorWatchService,
		private storeService: StoreService,
		private passGroupTypeService: PassGroupTypeService,
		private router: Router
	) { }

	ngOnInit(): void {
		// Создаем форму с контролами и валидаторами
		this.transactionForm = this.fb.group({
			token: ['', Validators.required], // Добавляем поле для талона
			contractorId: [null, Validators.required],
			storeId: [null, Validators.required],
			passTypeId: [null, Validators.required],
			startDate: [null, Validators.required],
			endDate: [null, Validators.required],
			position: ['', Validators.required]
		});

		// Загружаем данные для селектов
		this.contractorService.getContractors({ page: 1, pageSize: 100 }).subscribe(
			data => this.contractors = data,
			error => console.error('Ошибка при загрузке контрагентов', error)
		);

		this.storeService.getStores().subscribe(
			data => this.stores = data,
			error => console.error('Ошибка при загрузке торговых точек', error)
		);

		// Предположим, что в PassGroupTypeService используется метод getTypes()
		this.passGroupTypeService.getTypes().subscribe(
			data => this.passTypes = data,
			error => console.error('Ошибка при загрузке типов пропусков', error)
		);
	}

	/**
	 * Отправка формы для создания транзакции.
	 */
	createTransaction(): void {
		if (this.transactionForm.invalid) {
			return;
		}
		const transactionData = this.transactionForm.value;
		this.transactionService.createTransaction(transactionData).subscribe(
			() => this.router.navigate(['/transactions']),
			(error: any) => {
				console.error('Ошибка при создании транзакции', error);
				alert('Не удалось создать транзакцию.');
			}
		);
	}
}
