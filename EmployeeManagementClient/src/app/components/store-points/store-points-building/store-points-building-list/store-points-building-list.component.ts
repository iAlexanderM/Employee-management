import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Building } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-building-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
	templateUrl: './store-points-building-list.component.html',
	styleUrls: ['./store-points-building-list.component.css']
})
export class StorePointsBuildingListComponent implements OnInit, OnDestroy {
	buildings: Building[] = [];
	displayedBuildings: Building[] = [];
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
		this.loadBuildings(); // Загружаем данные при входе на страницу
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	// Обычная загрузка (серверная пагинация)
	loadBuildings(): void {
		this.isSearchMode = false;
		this.storePointsService.getBuildings(this.currentPage, this.pageSize).subscribe({
			next: (response) => {
				this.buildings = response.buildings || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedBuildings = this.buildings; // данные приходят уже постранично
			},
			error: (err) => {
				console.error('[loadBuildings] Ошибка загрузки данных:', err);
				this.buildings = [];
				this.displayedBuildings = [];
			},
		});
	}

	// Поиск без серверной пагинации: загружаем все результаты сразу и клиентски пагинируем
	searchBuildings(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.storePointsService.searchBuildings(this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.buildings = response.buildings || [];
				this.totalItems = this.buildings.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedBuildings(); // Локальная нарезка
			},
			error: (err) => {
				console.error('[searchBuildings] Ошибка выполнения поиска:', err);
				this.buildings = [];
				this.displayedBuildings = [];
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
		this.loadBuildings();
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedBuildings();
		} else {
			this.loadBuildings();
		}
		this.updateVisiblePages();
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.updateDisplayedBuildings();
		} else {
			this.loadBuildings();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	updateDisplayedBuildings(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedBuildings = this.buildings.slice(startIndex, endIndex);
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	updateVisiblePages(): void {
		// Логика такая же, как в store-select-or-add-modal.component.ts
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
				// Где-то в середине
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

	editBuilding(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/building/edit`, id]);
		}
	}

	addBuilding(): void {
		this.router.navigate(['/building/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewBuildingDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/building/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
