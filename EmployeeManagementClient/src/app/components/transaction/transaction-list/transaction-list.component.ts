import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { TransactionService, UpdatePendingDto } from '../../../services/transaction.service';
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
		// Инициализируем форму поиска с нужными полями фильтрации:
		// token – талон,
		// store – ID торговой точки (или можно использовать название, если сервер поддерживает поиск по нему),
		// contractor – ID или ФИО контрагента,
		// issuedBy – поле "Кто выписал" (скорректируйте имя поля в DTO и на сервере, если требуется)
		this.searchForm = this.fb.group({
			token: [''],
			store: [''],
			contractor: [''],
			issuedBy: ['']
		});

		// Подписываемся на изменения размера страницы
		this.pageSizeControl.valueChanges.subscribe(value => {
			this.pageSize = value;
			this.currentPage = 1;
			// Чтобы при изменении размера сразу применялись данные, можно вызвать поиск
			// либо же оставить только кнопку "Поиск"
			// this.loadTransactions();
		});

		// Первоначальная загрузка данных (без фильтрации)
		this.loadTransactions();
	}

	/**
	 * Загружает транзакции с учётом фильтров и параметров пагинации.
	 * Метод вызывается при нажатии кнопки "Поиск" и при переключении страниц.
	 */
	loadTransactions(): void {
		this.isLoading = true;
		// Формируем параметры из формы – если поле пустое, оно не отправится
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
	 */
	onPageSizeChange(event: any): void {
		this.pageSize = +event.target.value;
		this.currentPage = 1;
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
				this.loadTransactions(); // Обновляем список
			},
			error: err => {
				console.error('Ошибка при подтверждении оплаты:', err);
			}
		});
	}

	/**
	 * Нажатие на кнопку "Поиск". Вызывает загрузку транзакций с фильтрами.
	 */
	onSearchClick(): void {
		this.currentPage = 1; // сбрасываем страницу при поиске
		this.loadTransactions();
	}
}
