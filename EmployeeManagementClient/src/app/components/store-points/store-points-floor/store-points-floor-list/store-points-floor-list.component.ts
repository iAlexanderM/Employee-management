import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Floor } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-floor-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
	templateUrl: './store-points-floor-list.component.html',
	styleUrls: ['./store-points-floor-list.component.css']
})
export class StorePointsFloorListComponent implements OnInit, OnDestroy {
	floors: Floor[] = [];
	displayedFloors: Floor[] = [];
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
		this.loadFloors();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	// Обычная загрузка (серверная пагинация)
	loadFloors(): void {
		this.isSearchMode = false;
		this.storePointsService.getFloors(this.currentPage, this.pageSize, this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.floors = response.floors || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedFloors = this.floors; // данные уже постранично
			},
			error: (err) => {
				console.error('[loadFloors] Ошибка загрузки данных:', err);
				this.floors = [];
				this.displayedFloors = [];
			},
		});
	}

	// Поиск без серверной пагинации
	searchFloors(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.storePointsService.searchFloors(this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.floors = response.floors || []; // все результаты сразу
				this.totalItems = this.floors.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedFloors(); // локальная нарезка
			},
			error: (err) => {
				console.error('[searchFloors] Ошибка выполнения поиска:', err);
				this.floors = [];
				this.displayedFloors = [];
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
		this.loadFloors();
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedFloors();
		} else {
			this.loadFloors();
		}
		this.updateVisiblePages();
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.updateDisplayedFloors();
		} else {
			this.loadFloors();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	updateDisplayedFloors(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedFloors = this.floors.slice(startIndex, endIndex);
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

	editFloor(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/floor/edit`, id]);
		}
	}

	addFloor(): void {
		this.router.navigate(['/floor/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewFloorDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/floor/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
