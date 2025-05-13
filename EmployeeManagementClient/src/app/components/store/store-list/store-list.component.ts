import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { HistoryService } from '../../../services/history.service';

@Component({
	selector: 'app-store-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './store-list.component.html',
	styleUrls: ['./store-list.component.css'],
})
export class StoreListComponent implements OnInit, OnDestroy {
	allStores: Store[] = [];
	displayedStores: Store[] = [];
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	isSearchMode = false;

	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);

	searchForm: FormGroup;
	pageSizeControl: FormControl;

	private subscriptions: Subscription[] = [];
	private confirmedFields: { [key: string]: string | null } = {};
	private activeFilters: { [key: string]: any } = {};
	private readonly MAX_SEARCH_PAGE_SIZE = 10000;

	constructor(
		private storeService: StoreService,
		private router: Router,
		private fb: FormBuilder,
		private historyService: HistoryService
	) {
		this.searchForm = this.fb.group({
			Id: ['', Validators.pattern(/^\d+$/)],
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: [''],
			IsArchived: [false],
			Status: ['active'],
		});

		this.pageSizeControl = this.fb.control(this.pageSize);
	}

	ngOnInit(): void {
		this.loadStores();
		this.initializeAutocompleteHandlers();
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

	loadStores(isSearch: boolean = false): void {
		if (isSearch) {
			this.isSearchMode = true;
			this.currentPage = 1;
			this.activeFilters = this.prepareSearchCriteria();
		} else {
			this.isSearchMode = false;
			this.activeFilters = this.prepareSearchCriteria();
		}

		if (this.isSearchMode) {
			this.storeService.searchAllStores(this.activeFilters).subscribe({
				next: (stores: Store[]) => {
					console.log('[loadStores - Search] Ответ сервера:', stores);
					this.allStores = stores;
					this.totalItems = stores.length;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.setDisplayedStores();
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
			this.storeService.getStores(this.currentPage, this.pageSize, this.activeFilters).subscribe({
				next: (response: any) => {
					console.log('[loadStores - Server] Ответ сервера:', response);
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
					console.error('[loadStores - Server] Ошибка:', err);
					this.displayedStores = [];
					this.totalItems = 0;
					this.totalPages = 0;
					this.visiblePages = [];
				},
			});
		}
	}

	private setDisplayedStores(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedStores = this.allStores.slice(startIndex, endIndex);
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;
		this.currentPage = page;
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.setDisplayedStores();
		} else {
			this.loadStores(false);
		}
	}

	onPageClick(page: number | string): void {
		if (page === '...') return;
		this.goToPage(page);
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.totalPages = this.isSearchMode
			? Math.ceil(this.allStores.length / this.pageSize)
			: Math.ceil(this.totalItems / this.pageSize);
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.setDisplayedStores();
		} else {
			this.loadStores(false);
		}
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

	searchStores(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.loadStores(true);
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const formValue = this.searchForm.value;
		const criteria = Object.entries(formValue)
			.filter(([key, value]) => value !== null && value !== '' && key !== 'Status')
			.reduce<{ [key: string]: any }>((acc, [key, value]) => {
				acc[key] = key === 'Id' ? parseInt(value as string, 10) : value;
				return acc;
			}, {});

		// Фильтрация по статусу
		criteria['IsArchived'] = formValue.Status === 'archived';

		console.log('[prepareSearchCriteria] Сформированные критерии:', criteria);
		return criteria;
	}

	resetFilters(): void {
		this.searchForm.reset({ IsArchived: false, Status: 'active' });
		this.confirmedFields = {};
		this.isSearchMode = false;
		this.currentPage = 1;
		this.pageSizeControl.setValue(this.pageSizeOptions[0]);
		this.loadStores(false);
	}

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
			this.router.navigate([url]);
		}
	}

	editStore(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/stores/edit/${id}`]);
		}
	}

	archiveStore(id: number | undefined): void {
		if (id !== undefined) {
			this.storeService.archiveStore(id).subscribe({
				next: () => {
					this.historyService.logHistory({
						entityType: 'store',
						entityId: id.toString(),
						action: 'archive',
						details: `Магазин ${id} архивирован`,
						changes: {
							isArchived: {
								oldValue: 'Активен',
								newValue: 'Заархивирован',
							},
						},
						user: 'current_user',
					}).subscribe({
						next: () => {
							this.loadStores(this.isSearchMode);
						},
						error: (err) => {
							console.error('Ошибка при фиксации истории:', err);
						}
					});
				},
				error: (err) => {
					console.error('Ошибка при архивировании:', err);
				}
			});
		}
	}

	unarchiveStore(id: number | undefined): void {
		if (id !== undefined) {
			this.storeService.unarchiveStore(id).subscribe({
				next: () => {
					this.historyService.logHistory({
						entityType: 'store',
						entityId: id.toString(),
						action: 'unarchive',
						details: `Магазин ${id} разархивирован`,
						changes: {
							isArchived: {
								oldValue: 'Заархивирован',
								newValue: 'Активен',
							},
						},
						user: 'current_user',
					}).subscribe({
						next: () => {
							this.loadStores(this.isSearchMode);
						},
						error: (err) => {
							console.error('Ошибка при фиксации истории:', err);
						}
					});
				},
				error: (err) => {
					console.error('Ошибка при разархивировании:', err);
				}
			});
		}
	}
}