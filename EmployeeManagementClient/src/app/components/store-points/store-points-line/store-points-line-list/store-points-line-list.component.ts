import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Line } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-line-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
	templateUrl: './store-points-line-list.component.html',
	styleUrls: ['./store-points-line-list.component.css']
})
export class StorePointsLineListComponent implements OnInit, OnDestroy {
	lines: Line[] = [];
	displayedLines: Line[] = [];
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
		this.loadLines();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	// Обычная загрузка (серверная пагинация)
	loadLines(): void {
		this.isSearchMode = false;
		this.storePointsService.getLines(this.currentPage, this.pageSize, this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.lines = response.lines || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedLines = this.lines; // данные уже постранично
			},
			error: (err) => {
				console.error('[loadLines] Ошибка загрузки данных:', err);
				this.lines = [];
				this.displayedLines = [];
			},
		});
	}

	// Поиск без серверной пагинации
	searchLines(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.storePointsService.searchLines(this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.lines = response.lines || []; // все данные сразу
				this.totalItems = this.lines.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedLines(); // локальная нарезка
			},
			error: (err) => {
				console.error('[searchLines] Ошибка выполнения поиска:', err);
				this.lines = [];
				this.displayedLines = [];
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
		this.loadLines();
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedLines();
		} else {
			this.loadLines();
		}
		this.updateVisiblePages();
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.updateDisplayedLines();
		} else {
			this.loadLines();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	updateDisplayedLines(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedLines = this.lines.slice(startIndex, endIndex);
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

	editLine(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/line/edit`, id]);
		}
	}

	addLine(): void {
		this.router.navigate(['/line/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewLineDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/line/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
