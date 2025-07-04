import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
	selector: 'app-store-list',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
		MatAutocompleteModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
	],
	templateUrl: './store-list.component.html',
	styleUrls: ['./store-list.component.css']
})
export class StoreListComponent implements OnInit, OnDestroy {
	displayedStores: Store[] = [];
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	isSearchMode = false;
	isExpanded = false;
	isLoading = false;
	showArchived = false;
	errorMessage: string | null = null;

	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);

	searchForm: FormGroup;
	private subscriptions: Subscription[] = [];
	private confirmedFields: { [key: string]: string | null } = {};
	private activeFilters: { [key: string]: any } = {};

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
	}

	ngOnInit(): void {
		this.loadStores();
		this.initializeAutocompleteHandlers();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	loadStores(isSearch: boolean = false): void {
		this.errorMessage = null;
		if (isSearch) {
			this.isSearchMode = true;
			this.currentPage = 1;
			this.activeFilters = this.prepareSearchCriteria();
		} else {
			this.isSearchMode = false;
			this.activeFilters = {};
		}

		const params = {
			page: this.currentPage,
			pageSize: this.pageSize,
			isArchived: this.showArchived,
			...this.activeFilters,
		};

		this.isLoading = true;
		const subscription = this.storeService.getStores(this.currentPage, this.pageSize, params).subscribe({
			next: (response: any) => {
				this.isLoading = false;
				if (response && Array.isArray(response.stores)) {
					this.displayedStores = response.stores;
					this.totalItems = response.total ?? response.stores.length;
				} else if (Array.isArray(response)) {
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
				this.isLoading = false;
				console.error('[loadStores] Ошибка:', err);
				this.errorMessage = 'Не удалось загрузить магазины.';
				this.displayedStores = [];
				this.totalItems = 0;
				this.totalPages = 0;
				this.visiblePages = [];
			},
		});
		this.subscriptions.push(subscription);
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;
		this.currentPage = page;
		this.updateVisiblePages();
		this.loadStores();
	}

	onPageClick(page: number | string): void {
		if (page === '...') return;
		this.goToPage(page);
	}

	onPageSizeChange(event: Event): void {
		const selectElement = event.target as HTMLSelectElement;
		const newSize = parseInt(selectElement.value, 10);
		if (!isNaN(newSize)) {
			this.pageSize = newSize;
			this.currentPage = 1;
			this.totalPages = Math.ceil(this.totalItems / this.pageSize);
			this.loadStores();
		}
	}

	searchStores(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.storeService.clearSuggestionCache();
		this.loadStores(true);
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = {};
		Object.keys(this.searchForm.value).forEach((key) => {
			const value = this.searchForm.get(key)?.value;
			if (value !== null && value !== '') {
				criteria[key] = key === 'Id' ? parseInt(value, 10) : value.trim();
			}
		});
		criteria['isArchived'] = this.showArchived;
		return criteria;
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.activeFilters = {};
		this.showArchived = false;
		this.storeService.clearSuggestionCache();
		this.loadStores();
	}

	toggleArchived(): void {
		this.showArchived = !this.showArchived;
		this.currentPage = 1;
		this.loadStores();
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
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
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
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

	initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', (query: string) =>
			this.storeService.getBuildingSuggestions(query, this.showArchived)
		);
		this.setupAutocomplete('Floor', (query: string) =>
			this.storeService.getFloorSuggestions(query, this.showArchived)
		);
		this.setupAutocomplete('Line', (query: string) =>
			this.storeService.getLineSuggestions(query, this.showArchived)
		);
		this.setupAutocomplete('StoreNumber', (query: string) =>
			this.storeService.getStoreNumberSuggestions(query, this.showArchived)
		);
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
			this.router.navigate([`/stores/details/${id}`]);
		}
	}

	editStore(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/stores/edit/${id}`]);
		}
	}

	archiveStore(id: number | undefined): void {
		if (id !== undefined) {
			const subscription = this.storeService.archiveStore(id).subscribe({
				next: () => {
					this.loadStores(); // Обновляем список после архивирования
				},
				error: (err) => {
					console.error('Ошибка при архивировании:', err);
					this.errorMessage = err.message || 'Не удалось архивировать магазин.';
				},
			});
			this.subscriptions.push(subscription);
		}
	}

	unarchiveStore(id: number | undefined): void {
		if (id !== undefined) {
			const subscription = this.storeService.unarchiveStore(id).subscribe({
				next: () => {
					this.loadStores(); // Обновляем список после разархивирования
				},
				error: (err) => {
					console.error('Ошибка при разархивировании:', err);
					this.errorMessage = err.message || 'Не удалось разархивировать магазин.';
				},
			});
			this.subscriptions.push(subscription);
		}
	}
}