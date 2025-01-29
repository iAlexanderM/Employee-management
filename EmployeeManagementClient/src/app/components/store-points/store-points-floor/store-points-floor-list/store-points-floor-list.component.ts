import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Floor } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-floor-list',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule
	],
	templateUrl: './store-points-floor-list.component.html',
	styleUrls: ['./store-points-floor-list.component.css']
})
export class StorePointsFloorListComponent implements OnInit, OnDestroy {
	// Данные и отображаемый список
	floors: Floor[] = [];
	displayedFloors: Floor[] = [];

	// Форма поиска
	searchForm: FormGroup;

	// Флаги
	isSearchMode = false;
	isExpanded = false;

	// Параметры пагинации
	currentPage: number = 1;
	pageSizeOptions: number[] = [25, 50, 100];
	pageSize: number = 25;

	// Для расчета страниц
	totalItems: number = 0;
	totalPages: number = 0;
	visiblePages: (number | string)[] = [];

	// Управляем селектом pageSize реактивно
	pageSizeControl = new FormControl(this.pageSize);

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
		console.log('[ngOnInit] StorePointsFloorListComponent инициализировался.');

		// Подписка на изменение размера страницы
		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe((value) => {
				console.log('[pageSizeControl.valueChanges] новое значение:', value);
				const newSize = Number(value);
				if (!isNaN(newSize) && newSize > 0) {
					this.pageSize = newSize;
					this.currentPage = 1;
					this.calculateTotalPages();
					this.updateVisiblePages();

					if (this.isSearchMode) {
						this.updateDisplayedFloors();
					} else {
						this.loadFloors();
					}
				}
			})
		);

		this.loadFloors();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((s) => s.unsubscribe());
	}

	// ========== СЕРВЕРНАЯ ПАГИНАЦИЯ ==========
	loadFloors(): void {
		this.isSearchMode = false;
		const criteria = {}; // или this.prepareSearchCriteria() если надо
		console.log('[loadFloors] (серверная пагинация), page=', this.currentPage,
			'pageSize=', this.pageSize, 'criteria=', criteria);

		this.storePointsService.getFloors(this.currentPage, this.pageSize, criteria).subscribe({
			next: (response) => {
				console.log('[loadFloors] Ответ сервера:', response);

				this.floors = response.floors || [];
				this.totalItems = response.total || 0;

				console.log('[loadFloors] После парсинга:', {
					floorsCount: this.floors.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();

				// Данные уже постранично
				this.displayedFloors = this.floors;
				console.log('[loadFloors] displayedFloors:', this.displayedFloors);
			},
			error: (err) => {
				console.error('[loadFloors] Ошибка:', err);
				this.floors = [];
				this.displayedFloors = [];
			}
		});
	}

	// ========== ПОИСК (КЛИЕНТСКАЯ ПАГИНАЦИЯ) ==========
	searchFloors(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();

		console.log('[searchFloors] (клиентская пагинация) критерии:', criteria);
		this.storePointsService.searchFloors(criteria).subscribe({
			next: (response) => {
				console.log('[searchFloors] Ответ сервера:', response);

				this.floors = response.floors || [];
				this.totalItems = this.floors.length;

				console.log('[searchFloors] После парсинга:', {
					floorsCount: this.floors.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedFloors();

				console.log('[searchFloors] displayedFloors:', this.displayedFloors);
			},
			error: (err) => {
				console.error('[searchFloors] Ошибка поиска:', err);
				this.floors = [];
				this.displayedFloors = [];
			}
		});
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const raw = this.searchForm.value;
		console.log('[prepareSearchCriteria] raw form values:', raw);

		const criteria = Object.entries(raw)
			.filter(([_, val]) => val !== null && val !== '')
			.reduce<{ [key: string]: any }>((acc, [key, val]) => {
				if (key === 'Id') {
					const parsed = parseInt(val as string, 10);
					if (!isNaN(parsed)) {
						acc[key] = parsed;
					}
				} else {
					acc[key] = (val as string).trim();
				}
				return acc;
			}, {});

		console.log('[prepareSearchCriteria] итоговые критерии:', criteria);
		return criteria;
	}

	resetFilters(): void {
		console.log('[resetFilters] Сброс формы поиска');
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadFloors();
	}

	// Локальная нарезка (при поиске)
	updateDisplayedFloors(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedFloors = this.floors.slice(startIndex, endIndex);
	}

	// Переход по страницам
	goToPage(page: number | string): void {
		console.log('[goToPage] переход к странице:', page);
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

	onPageClick(page: number | string): void {
		console.log('[onPageClick] click page:', page);
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	// Подсчет страниц и генерация visiblePages
	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
		console.log('[calculateTotalPages]', { totalItems: this.totalItems, pageSize: this.pageSize, totalPages: this.totalPages });
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const totalVisible = 7;

		if (this.totalPages <= totalVisible) {
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
		console.log('[updateVisiblePages]', pages);
	}

	// Действия
	editFloor(id: number | undefined): void {
		console.log('[editFloor] id=', id);
		if (id !== undefined) {
			this.router.navigate([`/floor/edit`, id]);
		}
	}

	addFloor(): void {
		console.log('[addFloor]');
		this.router.navigate(['/floor/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
		console.log('[toggleSearchForm] isExpanded=', this.isExpanded);
	}

	viewFloorDetailsInNewTab(id: number | undefined): void {
		console.log('[viewFloorDetailsInNewTab] id=', id);
		if (id !== undefined) {
			const url = `/floor/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
