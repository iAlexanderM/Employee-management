// store-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';

@Component({
	selector: 'app-store-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './store-list.component.html',
	styleUrls: ['./store-list.component.css'],
})
export class StoreListComponent implements OnInit, OnDestroy {
	// Все магазины (используется только в режиме поиска)
	allStores: Store[] = [];
	// Отображаемые магазины (для таблицы)
	displayedStores: Store[] = [];

	// Общие параметры пагинации
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];

	// Флаг режима поиска
	isSearchMode = false;

	// Suggestions для автозаполнения
	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);

	// Форма поиска
	searchForm: FormGroup;
	// Контроль размера страницы (Reactive Form)
	pageSizeControl: FormControl;

	private subscriptions: Subscription[] = [];
	private confirmedFields: { [key: string]: string | null } = {};
	private activeFilters: { [key: string]: any } = {};

	// Константа для максимального pageSize при поиске
	private readonly MAX_SEARCH_PAGE_SIZE = 10000;

	constructor(
		private storeService: StoreService,
		private router: Router,
		private fb: FormBuilder
	) {
		this.searchForm = this.fb.group({
			Id: ['', Validators.pattern(/^\d+$/)],
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: [''],
		});

		this.pageSizeControl = this.fb.control(this.pageSize);
	}

	ngOnInit(): void {
		this.loadStores(); // Загрузка всех магазинов при инициализации
		this.initializeAutocompleteHandlers(); // Инициализация автозаполнения

		// Подписка на изменения размера страницы
		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe(value => {
				this.pageSize = value;
				this.onPageSizeChange();
			})
		);
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	/**
	 * Метод загрузки магазинов.
	 * @param isSearch - флаг, указывающий, выполняется ли поиск.
	 */
	loadStores(isSearch: boolean = false): void {
		if (isSearch) {
			this.isSearchMode = true;
			this.currentPage = 1; // Сброс на первую страницу при новом поиске
			this.activeFilters = this.prepareSearchCriteria(); // Сохранение фильтров
		} else {
			this.isSearchMode = false;
			this.activeFilters = {}; // Очистка фильтров при отмене поиска
		}

		if (this.isSearchMode) {
			// Клиентская пагинация при поиске: загружаем все соответствующие записи
			this.storeService.searchAllStores(this.activeFilters).subscribe({
				next: (stores: Store[]) => {
					console.log('[loadStores - Search] Ответ сервера:', stores);
					this.allStores = stores;
					this.totalItems = stores.length;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.setDisplayedStores(); // Установка отображаемых записей
				},
				error: (err) => {
					console.error('[loadStores - Search] Ошибка:', err);
					this.allStores = [];
					this.displayedStores = [];
					this.totalItems = 0;
					this.totalPages = 0;
					this.visiblePages = [];
				},
			});
		} else {
			// Серверная пагинация при отображении всех магазинов
			this.storeService.getStores(this.currentPage, this.pageSize).subscribe({
				next: (response: any) => {
					console.log('[loadStores - Server] Ответ сервера:', response);

					if (response && Array.isArray(response.stores)) {
						// Если сервер возвращает объект с магазинами и общим количеством
						this.displayedStores = response.stores;
						this.totalItems = response.total ?? response.stores.length;
					} else if (Array.isArray(response)) {
						// Если сервер возвращает массив (например, для неагрегированных данных)
						this.displayedStores = response;
						this.totalItems = response.length;
					} else {
						this.displayedStores = [];
						this.totalItems = 0;
					}

					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
				},
				error: (err) => {
					console.error('[loadStores - Server] Ошибка:', err);
					this.displayedStores = [];
					this.totalItems = 0;
					this.totalPages = 0;
					this.visiblePages = [];
				},
			});
		}
	}

	/**
	 * Метод для установки отображаемых записей при клиентской пагинации.
	 */
	private setDisplayedStores(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedStores = this.allStores.slice(startIndex, endIndex);
	}

	/**
	 * Метод для перехода к определенной странице.
	 * @param page - номер страницы.
	 */
	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;

		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		this.updateVisiblePages();

		if (this.isSearchMode) {
			this.setDisplayedStores(); // Обновление отображаемых записей при поиске
		} else {
			this.loadStores(false); // Загрузка данных с сервера при отображении всех магазинов
		}
	}

	/**
	 * Обработчик клика по странице пагинации.
	 * @param page - номер страницы или '...'.
	 */
	onPageClick(page: number | string): void {
		if (page === '...') return;
		this.goToPage(page);
	}

	/**
	 * Обработчик изменения размера страницы.
	 */
	onPageSizeChange(): void {
		this.currentPage = 1;
		this.totalPages = this.isSearchMode
			? Math.ceil(this.allStores.length / this.pageSize)
			: Math.ceil(this.totalItems / this.pageSize);
		this.updateVisiblePages();

		if (this.isSearchMode) {
			this.setDisplayedStores(); // Обновление отображаемых записей при поиске
		} else {
			this.loadStores(false); // Загрузка данных с сервера при отображении всех магазинов
		}
	}

	/**
	 * Обновление видимых страниц пагинации.
	 */
	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const totalVisiblePages = 7; // Максимальное количество отображаемых страниц

		if (this.totalPages <= totalVisiblePages) {
			// Если страниц меньше или равно максимальному количеству
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				// Если текущая страница в начале
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				// Если текущая страница в конце
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				// Если текущая страница в середине
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
	 * Метод для поиска магазинов.
	 */
	searchStores(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.loadStores(true);
	}

	/**
	 * Метод для подготовки критериев поиска.
	 */
	prepareSearchCriteria(): { [key: string]: any } {
		const criteria = Object.entries(this.searchForm.value)
			.filter(([_, value]) => value !== null && value !== '')
			.reduce<{ [key: string]: any }>((acc, [key, value]) => {
				acc[key] = key === 'Id' ? parseInt(value as string, 10) : (value as string).trim();
				return acc;
			}, {});

		console.log('[prepareSearchCriteria] Сформированные критерии:', criteria);
		return criteria;
	}

	/**
	 * Метод для сброса фильтров поиска.
	 */
	resetFilters(): void {
		this.searchForm.reset();
		this.confirmedFields = {};
		this.isSearchMode = false;
		this.currentPage = 1;
		this.pageSizeControl.setValue(this.pageSizeOptions[0]); // Сброс размера страницы
		this.loadStores(false);
	}

	/**
	 * Инициализация обработчиков автозаполнения.
	 */
	initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', this.storeService.getBuildingSuggestions.bind(this.storeService));
		this.setupAutocomplete('Floor', this.storeService.getFloorSuggestions.bind(this.storeService));
		this.setupAutocomplete('Line', this.storeService.getLineSuggestions.bind(this.storeService));
		this.setupAutocomplete('StoreNumber', this.storeService.getStoreNumberSuggestions.bind(this.storeService));
	}

	/**
	 * Настройка автозаполнения для определенного поля.
	 * @param controlName - имя контрола.
	 * @param suggestionServiceMethod - метод сервиса для получения предложений.
	 */
	setupAutocomplete(controlName: string, suggestionServiceMethod: (query: string) => Observable<string[]>): void {
		const control = this.searchForm.get(controlName);
		if (control) {
			this.subscriptions.push(
				control.valueChanges
					.pipe(
						debounceTime(300),
						distinctUntilChanged(),
						switchMap((query) => {
							const trimmedQuery = query?.trim() || '';
							if (this.confirmedFields[controlName] === trimmedQuery) {
								this.getSuggestionSubject(controlName).next([]);
								return of([]);
							}
							if (!trimmedQuery) {
								this.getSuggestionSubject(controlName).next([]);
								this.confirmedFields[controlName] = null;
								return of([]);
							}
							return suggestionServiceMethod(trimmedQuery).pipe(catchError(() => of([])));
						})
					)
					.subscribe((suggestions: string[]) => {
						this.getSuggestionSubject(controlName).next(suggestions);
					})
			);
		}
	}

	/**
	 * Обработчик ввода в поле автозаполнения.
	 * @param controlName - имя контрола.
	 * @param event - событие ввода.
	 */
	onInput(controlName: string, event: Event): void {
		const input = event.target as HTMLInputElement;
		const value = input.value.trim();
		this.getSuggestionSubject(controlName).next([]);
		if (!value) {
			this.confirmedFields[controlName] = null;
		}
	}

	/**
	 * Выбор предложения из автозаполнения.
	 * @param controlName - имя контрола.
	 * @param value - выбранное значение.
	 */
	selectSuggestion(controlName: string, value: string): void {
		this.searchForm.get(controlName)?.setValue(value);
		this.getSuggestionSubject(controlName).next([]);
		this.confirmedFields[controlName] = value;
	}

	/**
	 * Проверка, подтверждено ли поле.
	 * @param controlName - имя контрола.
	 */
	isFieldConfirmed(controlName: string): boolean {
		const currentValue = this.searchForm.get(controlName)?.value?.trim() || '';
		return this.confirmedFields[controlName] === currentValue;
	}

	/**
	 * Получение соответствующего BehaviorSubject для предложений.
	 * @param controlName - имя контрола.
	 */
	getSuggestionSubject(controlName: string): BehaviorSubject<string[]> {
		return {
			Building: this.buildingSuggestions$,
			Floor: this.floorSuggestions$,
			Line: this.lineSuggestions$,
			StoreNumber: this.storeNumberSuggestions$,
		}[controlName as 'Building' | 'Floor' | 'Line' | 'StoreNumber'];
	}

	/**
	 * Метод для просмотра деталей магазина.
	 * @param id - идентификатор магазина.
	 */
	viewStoreDetails(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/stores/details/${id}`;
			window.open(url, '_blank');
		}
	}

	/**
	 * Метод для редактирования магазина.
	 * @param id - идентификатор магазина.
	 */
	editStore(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/stores/edit/${id}`]);
		}
	}
}
