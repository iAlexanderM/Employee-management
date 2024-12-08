import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';

@Component({
	selector: 'app-store-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
	templateUrl: './store-list.component.html',
	styleUrls: ['./store-list.component.css'],
})
export class StoreListComponent implements OnInit, OnDestroy {
	stores: Store[] = [];
	totalItems = 0;
	totalPages = 0;
	displayedStores: Store[] = [];

	currentPage = 1;
	pageSize = 25;
	pageSizeOptions = [25, 50, 100];
	visiblePages: (number | string)[] = [];

	// Флаги
	isSearchMode = false;

	// Suggestions
	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);

	// Form
	searchForm: FormGroup;

	private subscriptions: Subscription[] = [];
	private confirmedFields: { [key: string]: string | null } = {};

	constructor(private storeService: StoreService, private router: Router, private fb: FormBuilder) {
		this.searchForm = this.fb.group({
			Id: ['', Validators.pattern(/^\d+$/)],
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: [''],
		});
	}

	ngOnInit(): void {
		this.loadStores();
		this.initializeAutocompleteHandlers();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	loadStores(): void {
		const filters = this.prepareSearchCriteria();
		this.storeService.getStores(this.currentPage, this.pageSize, filters).subscribe({
			next: (response) => {
				console.log('[loadStores] Response:', response);
				this.stores = response.stores || [];
				this.totalItems = response.total || 0;
				this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				this.updateVisiblePages();
				this.displayedStores = this.stores; // Данные уже получены с учётом пагинации
				console.log('[loadStores] Extracted stores:', this.displayedStores);
			},
			error: (err) => {
				console.error('[loadStores] Error:', err);
				this.stores = [];
				this.displayedStores = [];
			},
		});
	}

	// Метод для поиска магазинов
	searchStores(): void {
		this.currentPage = 1;
		this.loadStores();
	}

	// Подготовка критериев поиска
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

	// Сброс фильтров
	resetFilters(): void {
		this.searchForm.reset();
		this.confirmedFields = {};
		this.currentPage = 1;
		this.loadStores();
	}

	// Переход на страницу
	goToPage(page: number | string): void {
		if (typeof page !== 'number') {
			return; // Если page не число, ничего не делаем
		}
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
			this.loadStores();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	// Обработчик изменения размера страницы
	onPageSizeChange(): void {
		this.currentPage = 1;
		this.loadStores();
	}

	// Обновление видимых страниц пагинации
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
				for (let i = 1; i <= 6; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				// Если текущая страница в конце
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) {
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

	// Инициализация обработчиков автозаполнения
	initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', this.storeService.getBuildingSuggestions.bind(this.storeService));
		this.setupAutocomplete('Floor', this.storeService.getFloorSuggestions.bind(this.storeService));
		this.setupAutocomplete('Line', this.storeService.getLineSuggestions.bind(this.storeService));
		this.setupAutocomplete('StoreNumber', this.storeService.getStoreNumberSuggestions.bind(this.storeService));
	}

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

	onInput(controlName: string, event: Event): void {
		const input = event.target as HTMLInputElement;
		const value = input.value.trim();
		this.getSuggestionSubject(controlName).next([]);
		if (!value) {
			this.confirmedFields[controlName] = null;
		}
	}

	selectSuggestion(controlName: string, value: string): void {
		this.searchForm.get(controlName)?.setValue(value);
		this.getSuggestionSubject(controlName).next([]);
		this.confirmedFields[controlName] = value;
	}

	isFieldConfirmed(controlName: string): boolean {
		const currentValue = this.searchForm.get(controlName)?.value?.trim() || '';
		return this.confirmedFields[controlName] === currentValue;
	}

	getSuggestionSubject(controlName: string): BehaviorSubject<string[]> {
		return {
			Building: this.buildingSuggestions$,
			Floor: this.floorSuggestions$,
			Line: this.lineSuggestions$,
			StoreNumber: this.storeNumberSuggestions$,
		}[controlName as 'Building' | 'Floor' | 'Line' | 'StoreNumber'];
	}

	viewStoreDetails(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/stores/details/${id}`;
			window.open(url, '_blank');
		}
	}

	editStore(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/stores/edit/${id}`]);
		}
	}
}
