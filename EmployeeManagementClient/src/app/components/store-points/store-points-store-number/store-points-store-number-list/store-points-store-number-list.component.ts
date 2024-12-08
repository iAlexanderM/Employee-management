import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { StoreNumber } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-store-number-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
	templateUrl: './store-points-store-number-list.component.html',
	styleUrls: ['./store-points-store-number-list.component.css']
})
export class StorePointsStoreNumberListComponent implements OnInit, OnDestroy {
	storeNumbers: StoreNumber[] = [];
	displayedStoreNumbers: StoreNumber[] = [];
	searchForm: FormGroup;
	isSearchMode = false;
	currentPage: number = 1;
	pageSize: number = 25;
	totalPages: number = 0;
	totalItems: number = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions: number[] = [25, 50, 100];
	isExpanded = false;

	private subscriptions: Subscription[] = [];

	constructor(
		private storePointsService: StorePointsService,
		private fb: FormBuilder,
		private router: Router
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});
	}

	ngOnInit(): void {
		this.loadStoreNumbers();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	// Обычная загрузка (серверная пагинация)
	loadStoreNumbers(): void {
		this.isSearchMode = false;
		this.storePointsService.getStoreNumbers(this.currentPage, this.pageSize, this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.storeNumbers = response.storeNumbers || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedStoreNumbers = this.storeNumbers; // данные уже постранично
			},
			error: (err) => {
				console.error('[loadStoreNumbers] Ошибка загрузки данных:', err);
				this.storeNumbers = [];
				this.displayedStoreNumbers = [];
			},
		});
	}

	// Поиск без серверной пагинации
	searchStoreNumbers(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.storePointsService.searchStoreNumbers(this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.storeNumbers = response.storeNumbers || []; // все данные сразу
				this.totalItems = this.storeNumbers.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedStoreNumbers(); // локальная нарезка
			},
			error: (err) => {
				console.error('[searchStoreNumbers] Ошибка выполнения поиска:', err);
				this.storeNumbers = [];
				this.displayedStoreNumbers = [];
			},
		});
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria = Object.entries(this.searchForm.value)
			.filter(([_, value]) => value !== null && value !== '')
			.reduce<{ [key: string]: any }>((acc, [key, value]) => {
				acc[key] = key === 'Id' ? parseInt(value as string, 10) : (value as string).trim();
				return acc;
			}, {});

		return criteria;
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadStoreNumbers();
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedStoreNumbers();
		} else {
			this.loadStoreNumbers();
		}
		this.updateVisiblePages();
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.updateDisplayedStoreNumbers();
		} else {
			this.loadStoreNumbers();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	updateDisplayedStoreNumbers(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedStoreNumbers = this.storeNumbers.slice(startIndex, endIndex);
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];

		if (this.totalPages <= 7) {
			// Показываем все страницы
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				// В начале списка
				for (let i = 1; i <= 6; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				// В конце списка
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				// Посередине
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

	editStoreNumber(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/storeNumber/edit`, id]);
		}
	}

	addStoreNumber(): void {
		this.router.navigate(['/storeNumber/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewStoreNumberDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/storeNumber/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
