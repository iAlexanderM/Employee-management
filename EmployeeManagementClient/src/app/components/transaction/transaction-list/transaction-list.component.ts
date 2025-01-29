// src/app/components/transaction/transaction-list/transaction-list.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../../services/transaction.service';
import { SuggestionService } from '../../../services/suggestion.service';
import { PassTransaction } from '../../../models/transaction.model';
import { ContractorDto, Photo } from '../../../models/contractor.model'; // Импортируйте ContractorDto
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

// Angular Material
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSpinner } from '@angular/material/progress-spinner';

@Component({
	selector: 'app-transaction-list',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		ReactiveFormsModule,

		// Material
		MatAutocompleteModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule
	],
	templateUrl: './transaction-list.component.html',
	styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
	searchForm!: FormGroup;
	pageSizeControl = new FormControl(25);
	transactions: PassTransaction[] = [];
	totalItems = 0;
	currentPage = 1;
	pageSize = 25;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];
	isLoading = false;

	contractorOptions$: Observable<ContractorDto[]> = of([]);
	storeOptions$: Observable<string[]> = of([]);

	constructor(
		private fb: FormBuilder,
		private transactionService: TransactionService,
		private suggestionService: SuggestionService
	) { }

	ngOnInit(): void {
		this.searchForm = this.fb.group({
			token: [''],
			storeSearch: [''],
			contractorName: [null], // Изменено с '' на null для хранения объекта
			issuedBy: ['']
		});

		// При смене кол-ва элементов на странице:
		this.pageSizeControl.valueChanges.subscribe(value => {
			this.pageSize = value || 25;
			this.currentPage = 1;
			this.loadTransactions();
		});

		// Автодополнение ФИО контрагента
		this.contractorOptions$ = this.searchForm
			.get('contractorName')!
			.valueChanges.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(value => this.suggestionService.getContractorSuggestions(value || '')),
				catchError(() => of([]))
			);

		// Автодополнение для торговой точки
		this.storeOptions$ = this.searchForm
			.get('storeSearch')!
			.valueChanges.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(value => this.suggestionService.getStoreSuggestions(value || '')),
				catchError(() => of([]))
			);

		this.loadTransactions();
	}

	// Функция для отображения выбранного контрагента в поле ввода
	displayContractor(contractor: ContractorDto): string {
		return contractor ? `${contractor.lastName} ${contractor.firstName} ${contractor.middleName || ''}` : '';
	}

	loadTransactions(searchParams?: any): void {
		this.isLoading = true;
		const params = searchParams || this.searchForm.value;

		this.transactionService
			.searchTransactions(params, this.currentPage, this.pageSize)
			.subscribe({
				next: (result) => {
					this.totalItems = result.total;
					this.transactions = result.transactions;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.isLoading = false;
				},
				error: (err) => {
					console.error('Ошибка при поиске транзакций:', err);
					this.isLoading = false;
				}
			});
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const maxVisible = 7;

		if (this.totalPages <= maxVisible) {
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 6; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(this.totalPages);
			}
		}

		this.visiblePages = pages;
	}

	onPageClick(page: number | string): void {
		if (page === '...') return;
		const pageNumber = page as number;
		if (pageNumber < 1 || pageNumber > this.totalPages) return;
		this.currentPage = pageNumber;
		this.loadTransactions();
	}

	confirmPayment(id: number): void {
		if (!confirm('Подтвердить оплату?')) return;
		this.transactionService.confirmTransaction(id).subscribe({
			next: (response) => {
				alert(response.message);
				this.loadTransactions();
			},
			error: (err) => {
				console.error('Ошибка при подтверждении оплаты:', err);
			}
		});
	}

	onSearchClick(): void {
		this.currentPage = 1;
		const selectedContractor: ContractorDto = this.searchForm.get('contractorName')!.value;
		const searchParams = {
			...this.searchForm.value,
			contractorId: selectedContractor ? selectedContractor.id : null
		};
		this.loadTransactions(searchParams);
	}

	onResetFilters(): void {
		this.searchForm.reset({
			token: '',
			storeSearch: '',
			contractorName: null, // Сброс до null для объектов
			issuedBy: ''
		});
		this.currentPage = 1;
		this.loadTransactions();
	}
}
