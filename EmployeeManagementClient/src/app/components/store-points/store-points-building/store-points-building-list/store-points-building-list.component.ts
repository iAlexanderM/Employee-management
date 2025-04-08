import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Building } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import {
	FormBuilder,
	FormGroup,
	FormControl,
	ReactiveFormsModule
} from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-building-list',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule, // Уже не обязательно FormsModule для селекта
		RouterModule
	],
	templateUrl: './store-points-building-list.component.html',
	styleUrls: ['./store-points-building-list.component.css']
})
export class StorePointsBuildingListComponent implements OnInit, OnDestroy {
	// Все здания, загруженные или найденные
	buildings: Building[] = [];
	// Отображаемая на текущей странице часть
	displayedBuildings: Building[] = [];

	// Форма поиска
	searchForm: FormGroup;

	// Флаги/состояния
	isSearchMode = false;
	isExpanded = false;

	// Параметры пагинации
	currentPage: number = 1;
	totalItems: number = 0;
	totalPages: number = 0;
	visiblePages: (number | string)[] = [];

	pageSizeOptions: number[] = [25, 50, 100];
	pageSize: number = 25;

	// FormControl для выбора количества элементов на странице (Reactive Forms)
	pageSizeControl = new FormControl(this.pageSize);

	private subscriptions: Subscription[] = [];

	constructor(
		private storePointsService: StorePointsService,
		private fb: FormBuilder,
		private router: Router
	) {
		// Создаём форму поиска
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});
	}

	ngOnInit(): void {
		console.log('[ngOnInit] StorePointsBuildingListComponent инициализация.');

		// Реактивно подписываемся на изменения pageSize
		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe((value) => {
				console.log('[pageSizeControl.valueChanges] новое значение:', value);
				const newSize = Number(value);
				if (!isNaN(newSize) && newSize > 0) {
					this.pageSize = newSize;
					this.currentPage = 1; // Начинаем заново с 1-й страницы
					this.calculateTotalPages();
					this.updateVisiblePages();

					if (this.isSearchMode) {
						// Режим поиска -> клиентская пагинация
						this.updateDisplayedBuildings();
					} else {
						// Обычная (серверная) пагинация
						this.loadBuildings();
					}
				}
			})
		);

		// При инициализации грузим «обычным» способом (серверная пагинация)
		this.loadBuildings();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	// ==================== ЗАГРУЗКА (СЕРВЕРНАЯ ПАГИНАЦИЯ) ====================
	loadBuildings(): void {
		this.isSearchMode = false;
		// При серверной пагинации не подставляем критерии поиска,
		// либо подставляем, если вы хотите искать и при серверной пагинации.
		const criteria = {}; // Или this.prepareSearchCriteria(), если нужно

		console.log('[loadBuildings] Серверная пагинация, параметры:', {
			page: this.currentPage,
			pageSize: this.pageSize,
			criteria
		});

		this.storePointsService.getBuildings(this.currentPage, this.pageSize, criteria).subscribe({
			next: (response) => {
				console.log('[loadBuildings] Ответ сервера:', response);

				// Разбираем
				this.buildings = response.buildings || [];
				this.totalItems = response.total || 0;

				console.log('[loadBuildings] После парсинга:', {
					buildingsCount: this.buildings.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();

				// При серверной пагинации в response уже постраничные данные
				this.displayedBuildings = this.buildings;

				console.log('[loadBuildings] displayedBuildings:', this.displayedBuildings);
			},
			error: (err) => {
				console.error('[loadBuildings] Ошибка:', err);
				this.buildings = [];
				this.displayedBuildings = [];
			}
		});
	}

	// ==================== ПОИСК (БЕЗ СЕРВЕРНОЙ ПАГИНАЦИИ) ====================
	searchBuildings(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();

		console.log('[searchBuildings] Клиентская пагинация, критерии:', criteria);

		this.storePointsService.searchBuildings(criteria).subscribe({
			next: (response) => {
				console.log('[searchBuildings] Ответ сервера:', response);

				// При поиске получаем все записи, которые подходят под критерий
				this.buildings = response.buildings || [];
				this.totalItems = this.buildings.length;

				console.log('[searchBuildings] После парсинга:', {
					buildingsCount: this.buildings.length,
					totalItems: this.totalItems
				});

				// Ручная пагинация на клиенте
				this.calculateTotalPages();
				this.updateVisiblePages();

				this.updateDisplayedBuildings();
				console.log('[searchBuildings] displayedBuildings:', this.displayedBuildings);
			},
			error: (err) => {
				console.error('[searchBuildings] Ошибка:', err);
				this.buildings = [];
				this.displayedBuildings = [];
			}
		});
	}

	// ==================== ПОДГОТОВКА КРИТЕРИЕВ ПОИСКА ====================
	prepareSearchCriteria(): { [key: string]: any } {
		const rawValues = this.searchForm.value;
		console.log('[prepareSearchCriteria] raw form values:', rawValues);

		const criteria = Object.entries(rawValues)
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

	// ==================== СБРОС ====================
	resetFilters(): void {
		console.log('[resetFilters] Сброс формы поиска');
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadBuildings(); // Возвращаемся к серверной пагинации
	}

	// ==================== НАРЕЗКА ДАННЫХ (КЛИЕНТСКАЯ ПАГИНАЦИЯ) ====================
	updateDisplayedBuildings(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedBuildings = this.buildings.slice(startIndex, endIndex);
	}

	// ==================== ПЕРЕХОД ПО СТРАНИЦАМ ====================
	goToPage(page: number | string): void {
		console.log('[goToPage] переход к странице:', page);

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

	onPageClick(page: number | string): void {
		console.log('[onPageClick] клик по странице:', page);
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	// ==================== ПОДСЧЁТ СТРАНИЦ / ФОРМИРОВАНИЕ СПИСКА СТРАНИЦ ====================
	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
		console.log('[calculateTotalPages] totalItems=', this.totalItems,
			'pageSize=', this.pageSize,
			'=> totalPages=', this.totalPages);
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const totalVisiblePages = 7;

		if (this.totalPages <= totalVisiblePages) {
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
		console.log('[updateVisiblePages] visiblePages=', pages);
	}

	// ==================== ДЕЙСТВИЯ С КНОПКАМИ ====================
	editBuilding(id: number | undefined): void {
		console.log('[editBuilding] id=', id);
		if (id !== undefined) {
			this.router.navigate([`/building/edit`, id]);
		}
	}

	addBuilding(): void {
		console.log('[addBuilding]');
		this.router.navigate(['/building/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
		console.log('[toggleSearchForm] isExpanded=', this.isExpanded);
	}

	viewBuildingDetailsInNewTab(id: number | undefined): void {
		console.log('[viewBuildingDetailsInNewTab] id=', id);
		if (id !== undefined) {
			const url = `/building/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
