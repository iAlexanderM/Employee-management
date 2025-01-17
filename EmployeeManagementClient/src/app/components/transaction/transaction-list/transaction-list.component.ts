// src/app/components/transaction/transaction-list/transaction-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../../../services/transaction.service';
import { PassTransaction } from '../../../models/transaction.model';

@Component({
	selector: 'app-transaction-list',
	standalone: true,
	imports: [CommonModule, RouterModule, ReactiveFormsModule],
	templateUrl: './transaction-list.component.html',
	styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
	searchForm!: FormGroup;
	// Отдельная FormControl для размера страницы
	pageSizeControl: FormControl = new FormControl(25);

	transactions: PassTransaction[] = [];

	// Пагинация
	totalItems = 0;
	currentPage = 1;
	pageSize = 25;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];

	isLoading = false;

	constructor(
		private fb: FormBuilder,
		private transactionService: TransactionService
	) { }

	ngOnInit(): void {
		// Инициализируем форму поиска. Добавьте нужные поля фильтрации.
		this.searchForm = this.fb.group({
			token: ['']
			// Можно добавить дополнительные поля, например: dateFrom, dateTo и др.
		});

		// Подписываемся на изменения размера страницы
		this.pageSizeControl.valueChanges.subscribe(value => {
			this.pageSize = value;
			this.currentPage = 1;
			this.loadTransactions();
		});

		// При изменении значений в форме поиска сбрасываем номер страницы и загружаем данные
		this.searchForm.valueChanges.subscribe(() => {
			this.currentPage = 1;
			this.loadTransactions();
		});

		// Первоначальная загрузка данных
		this.loadTransactions();
	}

	/**
	 * Загружает транзакции с учётом фильтров и параметров пагинации.
	 */
	loadTransactions(): void {
		this.isLoading = true;
		const searchParams = this.searchForm.value;
		this.transactionService.searchTransactions(searchParams, this.currentPage, this.pageSize).subscribe({
			next: result => {
				this.totalItems = result.total;
				this.transactions = result.transactions;
				this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				this.updateVisiblePages();
				this.isLoading = false;
				console.log(`Найдено транзакций: ${this.totalItems}`);
			},
			error: err => {
				console.error('Ошибка при поиске транзакций:', err);
				this.isLoading = false;
			}
		});
	}

	/**
	 * Обновляет массив видимых страниц для пагинации.
	 */
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

	/**
	 * Переход на выбранную страницу.
	 */
	onPageClick(page: number | string): void {
		if (page === '...') return;
		const pageNumber = page as number;
		if (pageNumber < 1 || pageNumber > this.totalPages) return;
		this.currentPage = pageNumber;
		this.loadTransactions();
	}

	/**
	 * Обработчик изменения размера страницы.
	 * (Действие уже обработано через подписку на pageSizeControl.valueChanges,
	 * но можно оставить этот метод, если вы решите использовать (change) в шаблоне.)
	 */
	onPageSizeChange(): void {
		this.currentPage = 1;
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
		this.loadTransactions();
	}

	/**
	 * Подтверждение оплаты транзакции.
	 */
	confirmPayment(id: number): void {
		if (!confirm('Вы действительно хотите подтвердить оплату?')) {
			return;
		}
		this.transactionService.confirmTransaction(id).subscribe({
			next: response => {
				alert(response.message);
				this.loadTransactions();
			},
			error: err => {
				console.error('Ошибка при подтверждении оплаты:', err);
			}
		});
	}
}
