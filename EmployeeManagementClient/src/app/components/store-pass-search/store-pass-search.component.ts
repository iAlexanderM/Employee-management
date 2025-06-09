import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of, forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';
import { PassService } from '../../services/pass.service';
import { TransactionService } from '../../services/transaction.service';
import { StoreService } from '../../services/store.service';
import { UserService } from '../../services/user.service';
import { HistoryService } from '../../services/history.service';
import { SearchFilterResetService } from '../../services/search-filter-reset.service';
import { PassByStoreResponseDto, ContractorPassesDto, PassDetailsDto } from '../../models/store-pass-search.model';
import { HistoryEntry, ChangeValue } from '../../models/history.model';
import { ApplicationUser } from '../../models/application-user.model';
import { environment } from '../../../environments/environment';
import { ContractorDto, PassType, Store as TransactionStore } from '../../models/transaction.model';
import { Store } from '../../models/store.model';

@Component({
	selector: 'app-store-pass-search',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './store-pass-search.component.html',
	styleUrls: ['./store-pass-search.component.css'],
	providers: [DatePipe],
})
export class StorePassSearchComponent implements OnInit, OnDestroy, AfterViewInit {
	searchForm: FormGroup;
	results: PassByStoreResponseDto[] = [];
	isLoading = false;
	errorMessage: string | null = null;
	successMessage: string | null = null;
	showAddTransactionButton = false;
	private readonly apiBaseUrl = 'http://localhost:8080';
	private destroy$ = new Subject<void>();

	noteForms: { [resultIndex: number]: FormGroup } = {};
	historyEntries: { [resultIndex: number]: HistoryEntry[] } = {};
	showHistory: { [resultIndex: number]: boolean } = {};
	isLoadingHistory: { [resultIndex: number]: boolean } = {};
	userMap: { [key: string]: string } = {};

	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);

	private resetSubscription: Subscription | undefined;
	private subscriptions: Subscription[] = [];
	private confirmedFields: { [key: string]: string | null } = {
		Building: null,
		Floor: null,
		Line: null,
		StoreNumber: null,
	};
	private panelStates: { [key: string]: boolean } = {};

	private allContractors: { resultIndex: number; contractor: ContractorPassesDto; isActive: boolean }[] = [];
	public windows: { [resultIndex: number]: { start: number; end: number } } = {};
	private windowSize = 100;
	private windowStep = 50;
	private observer: IntersectionObserver | null = null;

	activeDropdown: string | null = null;

	constructor(
		private fb: FormBuilder,
		private passService: PassService,
		private transactionService: TransactionService,
		private storeService: StoreService,
		private router: Router,
		private searchFilterResetService: SearchFilterResetService,
		private cdr: ChangeDetectorRef,
		private zone: NgZone,
		private datePipe: DatePipe,
		private userService: UserService,
		private historyService: HistoryService
	) {
		this.searchForm = this.fb.group({
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: [''],
		});
	}

	ngOnInit(): void {
		this.resetSubscription = this.searchFilterResetService.resetTrigger$
			.pipe(takeUntil(this.destroy$))
			.subscribe((needsReset) => {
				if (needsReset) {
					this.resetFilters();
					this.searchFilterResetService.consumeReset();
				}
			});
		this.loadStoredSearchCriteria();
		this.initializeAutocompleteHandlers();
	}

	ngAfterViewInit(): void {
		this.setupIntersectionObserver();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
		this.resetSubscription?.unsubscribe();
		this.observer?.disconnect();
		this.destroy$.next();
		this.destroy$.complete();
	}

	private setupIntersectionObserver(): void {
		this.observer = new IntersectionObserver(
			(entries) => {
				this.zone.run(() => {
					entries.forEach((entry) => {
						const resultIndex = parseInt(entry.target.getAttribute('data-result-index') || '0', 10);
						const contractorIndex = parseInt(entry.target.getAttribute('data-contractor-index') || '0', 10);
						const window = this.windows[resultIndex] || { start: 0, end: this.windowSize };
						const totalContractors = this.allContractors.filter((c) => c.resultIndex === resultIndex).length;

						if (entry.isIntersecting) {
							if (contractorIndex >= window.end - 10 && totalContractors > window.end) {
								window.start = window.start + this.windowStep;
								window.end = Math.min(window.start + this.windowSize, totalContractors);
								this.windows[resultIndex] = window;
								this.cdr.detectChanges();
								this.updateObservers();
							} else if (contractorIndex <= window.start + 10 && window.start > 0) {
								window.start = Math.max(window.start - this.windowStep, 0);
								window.end = window.start + this.windowSize;
								this.windows[resultIndex] = window;
								this.cdr.detectChanges();
								this.updateObservers();
							}
						}
					});
				});
			},
			{ root: null, threshold: 0.1, rootMargin: '200px' }
		);

		this.updateObservers();
	}

	private updateObservers(): void {
		if (!this.observer) return;
		this.observer.disconnect();
		this.results.forEach((_, resultIndex) => {
			const contractors = this.getContractorsWindowedFor(resultIndex);
			contractors.forEach((_, contractorIndex) => {
				const table = document.querySelector(
					`[data-result-index="${resultIndex}"][data-contractor-index="${contractorIndex + this.windows[resultIndex].start}"]`
				);
				if (table) {
					this.observer!.observe(table);
				}
			});
		});
	}

	private resetVirtualScrollState(): void {
		this.allContractors = [];
		this.windows = {};
		this.observer?.disconnect();
	}

	private prepareContractorsForVirtualScroll(): void {
		this.allContractors = [];
		this.windows = {};
		this.results.forEach((result, resultIndex) => {
			const activeContractors = this.getActiveContractors(result).map((contractor) => ({
				resultIndex,
				contractor,
				isActive: true,
			}));
			this.allContractors.push(...activeContractors);
			this.windows[resultIndex] = { start: 0, end: this.windowSize };
			if (environment.debug) {
				console.log(`[PrepareContractors] Total contractors: ${this.allContractors.length}`);
				const count = this.allContractors.filter((c) => c.resultIndex === resultIndex).length;
				console.log(`[PrepareContractors][${resultIndex}] Contractors: ${count}`);
			}
		});
	}

	public getContractorsWindowedFor(resultIndex: number): { contractor: ContractorPassesDto; isActive: boolean }[] {
		const window = this.windows[resultIndex] || { start: 0, end: this.windowSize };
		const contractors = this.allContractors
			.filter((c) => c.resultIndex === resultIndex)
			.slice(window.start, window.end)
			.map((c) => ({ contractor: c.contractor, isActive: c.isActive }));
		if (environment.debug) {
			console.log(`[GetContractors][${resultIndex}] Window=[${window.start},${window.end}], Count=${contractors.length}`);
		}
		return contractors;
	}

	private loadStoredSearchCriteria(): void {
		const storedCriteria = localStorage.getItem('storeSearchCriteria');
		if (storedCriteria) {
			try {
				const criteria = JSON.parse(storedCriteria);
				const valueToPatch: any = {};
				if (criteria.building) valueToPatch.Building = criteria.building;
				if (criteria.floor) valueToPatch.Floor = criteria.floor;
				if (criteria.line) valueToPatch.Line = criteria.line;
				if (criteria.storeNumber) valueToPatch.StoreNumber = criteria.storeNumber;
				this.searchForm.patchValue(valueToPatch);
				this.confirmedFields = {
					Building: criteria.building || null,
					Floor: criteria.floor || null,
					Line: criteria.line || null,
					StoreNumber: criteria.storeNumber || null,
				};
				this.searchPasses();
			} catch (e) {
				localStorage.removeItem('storeSearchCriteria');
			}
		}
	}

	private saveSearchCriteria(): void {
		const criteria = this.prepareSearchCriteria();
		localStorage.setItem('storeSearchCriteria', JSON.stringify(criteria));
	}

	searchPasses(): void {
		this.errorMessage = null;
		this.successMessage = null;
		this.showAddTransactionButton = false;
		this.results = [];
		this.noteForms = {};
		this.historyEntries = {};
		this.showHistory = {};
		this.isLoadingHistory = {};
		this.userMap = {};

		const allFieldsConfirmed = Object.values(this.confirmedFields).every((value) => value !== null && value.trim() !== '');
		if (!allFieldsConfirmed) {
			this.errorMessage = 'Выберите значения для всех полей из списка';
			this.cdr.markForCheck();
			return;
		}

		this.isLoading = true;
		const criteria = this.prepareSearchCriteria();

		this.passService
			.searchPassesByStore(criteria)
			.pipe(
				takeUntil(this.destroy$),
				catchError((error) => {
					this.errorMessage = error?.status === 404 ? 'Торговая точка не найдена или не существует.' : error?.message || 'Ошибка при выполнении поиска.';
					this.isLoading = false;
					this.resetVirtualScrollState();
					this.cdr.markForCheck();
					return of([]);
				})
			)
			.subscribe((response: PassByStoreResponseDto[]) => {
				const filteredResults = response.filter(result => !result.isArchived);
				if (filteredResults.length === 0) {
					this.errorMessage = 'Торговая точка не найдена или не существует.';
					this.isLoading = false;
					this.cdr.markForCheck();
					return;
				}

				// Подготавливаем результаты
				const tempResults = filteredResults.map((result) => ({
					...result,
					contractors: (result.contractors || []).filter(c => c.activePasses && c.activePasses.length > 0).map((contractor) => ({
						...contractor,
						activePasses: this.getSortedPasses(contractor.allActivePasses, result),
						closedPasses: [],
					})),
				}));

				// Загружаем заметки для каждого магазина
				const storeObservables = tempResults.map((result, index) =>
					this.storeService.getStoreById(result.storeId).pipe(
						catchError((err) => {
							console.error(`[searchPasses][${index}] Error fetching store:`, err);
							return of({ note: null } as Store); // Fallback
						})
					)
				);

				forkJoin(storeObservables).subscribe((stores: Store[]) => {
					// Присваиваем results и создаём формы только после загрузки всех данных
					this.results = tempResults.map((result, index) => ({
						...result,
						note: stores[index].note ?? null, // Преобразуем undefined в null
					}));

					this.results.forEach((result, index) => {
						console.debug(`[searchPasses][${index}] Loading note from store:`, stores[index].note);
						this.noteForms[index] = this.fb.group({
							note: [stores[index].note || '', [Validators.maxLength(500)]], // Как в StoreDetailsComponent
						});
						console.debug(`[searchPasses][${index}] noteForm value:`, this.noteForms[index].value);
						this.showHistory[index] = false;
						this.isLoadingHistory[index] = false;
						this.historyEntries[index] = [];
					});

					this.isLoading = false;
					this.saveSearchCriteria();
					this.panelStates = {};
					this.showAddTransactionButton = this.results.length > 0;
					this.prepareContractorsForVirtualScroll();
					setTimeout(() => this.updateObservers(), 100);
					this.cdr.detectChanges();
					this.loadUsersForHistory();
				});
			});
	}

	saveNote(resultIndex: number): void {
		const result = this.results[resultIndex];
		if (!result.storeId || !this.noteForms[resultIndex].valid) {
			console.debug(`[saveNote][${resultIndex}] Invalid: storeId=${result.storeId}, formValid=${this.noteForms[resultIndex].valid}`);
			this.setMessage('ID торговой точки не определён или заметка недействительна', 'error');
			return;
		}

		const note = this.noteForms[resultIndex].get('note')?.value?.trim() || null;
		console.debug(`[saveNote][${resultIndex}] Saving note:`, note, `Current note:`, result.note);
		if (note === result.note) {
			console.debug(`[saveNote][${resultIndex}] Note unchanged`);
			return;
		}

		this.isLoading = true;
		// Запрашиваем текущий Store, чтобы получить sortOrder
		this.storeService.getStoreById(result.storeId).subscribe({
			next: (store: Store) => {
				const storeUpdate: Partial<Store> = {
					building: result.building,
					floor: result.floor,
					line: result.line,
					storeNumber: result.storeNumber,
					note: note,
					isArchived: result.isArchived,
					sortOrder: store.sortOrder || 0, // Берём sortOrder из Store или 0
				};
				console.debug(`[saveNote][${resultIndex}] Sending update:`, storeUpdate);
				this.storeService.updateStore(result.storeId, storeUpdate).subscribe({
					next: () => {
						console.debug(`[saveNote][${resultIndex}] Note saved successfully`);
						this.results[resultIndex].note = note;
						this.noteForms[resultIndex].patchValue({ note: note || '' });
						this.noteForms[resultIndex].markAsPristine();
						this.setMessage('Заметка успешно сохранена', 'success');
						if (this.showHistory[resultIndex]) {
							this.loadHistory(resultIndex);
						}
						this.isLoading = false;
						this.cdr.markForCheck();
					},
					error: (err) => {
						console.error(`[saveNote][${resultIndex}] Error:`, err);
						this.setMessage('Ошибка при сохранении заметки: ' + (err.message || 'Неизвестная ошибка'), 'error');
						this.isLoading = false;
						this.cdr.markForCheck();
					},
				});
			},
			error: (err) => {
				console.error(`[saveNote][${resultIndex}] Error fetching store:`, err);
				this.setMessage('Ошибка при получении данных магазина', 'error');
				this.isLoading = false;
				this.cdr.markForCheck();
			},
		});
	}

	private setMessage(message: string, type: 'success' | 'error', timeout: number = 5000): void {
		if (type === 'success') {
			this.successMessage = message;
			this.errorMessage = null;
		} else {
			this.errorMessage = message;
			this.successMessage = null;
		}
		setTimeout(() => {
			if (type === 'success') this.successMessage = null;
			else this.errorMessage = null;
			this.cdr.markForCheck();
		}, timeout);
	}

	toggleHistory(resultIndex: number): void {
		this.showHistory[resultIndex] = !this.showHistory[resultIndex];
		if (this.showHistory[resultIndex] && this.results[resultIndex]) {
			this.loadHistory(resultIndex);
		} else {
			this.historyEntries[resultIndex] = [];
		}
		this.cdr.markForCheck();
	}

	loadHistory(resultIndex: number): void {
		const result = this.results[resultIndex];
		if (!result.storeId) {
			this.setMessage('ID торговой точки не определён', 'error');
			return;
		}
		this.isLoadingHistory[resultIndex] = true;
		this.historyService.getHistory('store', result.storeId.toString()).subscribe({
			next: (historyEntries: HistoryEntry[]) => {
				console.debug(`[LoadHistory][${resultIndex}] Загружено записей: ${historyEntries.length}`, historyEntries);
				this.historyEntries[resultIndex] = historyEntries;
				this.isLoadingHistory[resultIndex] = false;
				if (historyEntries.length === 0) {
					console.debug(`История для торговой точки ${result.storeId} пуста`);
				}
				this.loadUsersForHistory();
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error(`[LoadHistory][${resultIndex}] Ошибка:`, err);
				this.setMessage(err.message || 'Не удалось загрузить историю изменений.', 'error');
				this.isLoadingHistory[resultIndex] = false;
				this.historyEntries[resultIndex] = [];
				this.cdr.markForCheck();
			},
		});
	}

	private loadUsersForHistory(): void {
		this.userService.getAllUsers().subscribe({
			next: (users: ApplicationUser[]) => {
				this.userMap = users.reduce((map, user) => {
					map[user.id] = user.userName;
					return map;
				}, {} as { [key: string]: string });
				console.debug('Обновлён userMap:', this.userMap);
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error('Ошибка при загрузке пользователей:', err);
				this.setMessage('Не удалось загрузить данные пользователей для истории.', 'error');
				this.cdr.markForCheck();
			},
		});
	}

	formatHistoryAction(action: string): string {
		const actionMap: { [key: string]: string } = {
			create: 'Создание',
			update: 'Обновление',
			archive: 'Архивирование',
			unarchive: 'Разархивирование',
			update_note: 'Изменение заметки',
		};
		return actionMap[action.toLowerCase()] || action;
	}

	formatHistoryChanges(changes: { [key: string]: ChangeValue } | undefined): string {
		if (!changes || !Object.keys(changes).length) {
			return 'Изменения отсутствуют';
		}
		return Object.entries(changes)
			.map(([key, value]) => {
				const fieldName = this.translateFieldName(key);
				const oldValue = value.oldValue ?? 'не указано';
				const newValue = value.newValue ?? 'не указано';
				return `${fieldName}: с "${oldValue}" на "${newValue}"`;
			})
			.join('; ');
	}

	private translateFieldName(field: string): string {
		const fieldTranslations: { [key: string]: string } = {
			building: 'Здание',
			floor: 'Этаж',
			line: 'Линия',
			storeNumber: 'Номер магазина',
			sortOrder: 'Порядок сортировки',
			note: 'Заметка',
			isArchived: 'Статус архивации',
		};
		return fieldTranslations[field] || field;
	}

	resetFilters(): void {
		this.searchForm.reset({ Building: '', Floor: '', Line: '', StoreNumber: '' });
		this.confirmedFields = { Building: null, Floor: null, Line: null, StoreNumber: null };
		localStorage.removeItem('storeSearchCriteria');
		this.results = [];
		this.errorMessage = null;
		this.successMessage = null;
		this.noteForms = {};
		this.historyEntries = {};
		this.showHistory = {};
		this.isLoadingHistory = {};
		this.userMap = {};
		this.buildingSuggestions$.next([]);
		this.floorSuggestions$.next([]);
		this.lineSuggestions$.next([]);
		this.storeNumberSuggestions$.next([]);
		this.panelStates = {};
		this.resetVirtualScrollState();
		this.activeDropdown = null;
		this.cdr.detectChanges();
	}

	prepareSearchCriteria(): any {
		return {
			building: this.confirmedFields['Building'] || '',
			floor: this.confirmedFields['Floor'] || '',
			line: this.confirmedFields['Line'] || '',
			storeNumber: this.confirmedFields['StoreNumber'] || '',
			showActive: true,
			showClosed: false,
			isArchived: false
		};
	}

	initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', (query: string) => this.storeService.getBuildingSuggestions(query, false));
		this.setupAutocomplete('Floor', (query: string) => this.storeService.getFloorSuggestions(query, false));
		this.setupAutocomplete('Line', (query: string) => this.storeService.getLineSuggestions(query, false));
		this.setupAutocomplete('StoreNumber', (query: string) => this.storeService.getStoreNumberSuggestions(query, false));
	}

	setupAutocomplete(controlName: string, suggestionServiceMethod: (query: string) => Observable<string[]>): void {
		const control = this.searchForm.get(controlName);
		if (control) {
			this.subscriptions.push(
				control.valueChanges
					.pipe(
						takeUntil(this.destroy$),
						debounceTime(300),
						distinctUntilChanged(),
						switchMap((query) => {
							const trimmedQuery = query?.trim() || '';
							if (this.confirmedFields[controlName] === trimmedQuery) return of([]);
							if (!trimmedQuery) {
								this.confirmedFields[controlName] = null;
								return of([]);
							}
							return suggestionServiceMethod(trimmedQuery).pipe(catchError(() => of([])));
						})
					)
					.subscribe((suggestions) => {
						this.getSuggestionSubject(controlName).next(suggestions);
						if (suggestions.length > 0) {
							this.activeDropdown = controlName;
						} else {
							this.activeDropdown = null;
						}
						this.cdr.detectChanges();
					})
			);
		}
	}

	selectSuggestion(controlName: string, value: string): void {
		this.searchForm.get(controlName)?.setValue(value, { emitEvent: false });
		this.confirmedFields[controlName] = value;
		this.getSuggestionSubject(controlName).next([]);
		this.activeDropdown = null;
		this.cdr.detectChanges();
	}

	onInput(controlName: string, event: Event): void {
		const value = (event.target as HTMLInputElement).value.trim();
		if (!this.confirmedFields[controlName] || this.confirmedFields[controlName] !== value) {
			this.confirmedFields[controlName] = null;
		}
	}

	toggleDropdown(controlName: string): void {
		if (this.activeDropdown === controlName) {
			this.activeDropdown = null;
		} else {
			this.activeDropdown = controlName;
			const query = this.searchForm.get(controlName)?.value?.trim() || '';
			if (query) {
				this.getSuggestionSubject(controlName).next([]);
				const suggestionMethod = {
					Building: () => this.storeService.getBuildingSuggestions(query, false),
					Floor: () => this.storeService.getFloorSuggestions(query, false),
					Line: () => this.storeService.getLineSuggestions(query, false),
					StoreNumber: () => this.storeService.getStoreNumberSuggestions(query, false),
				}[controlName as 'Building' | 'Floor' | 'Line' | 'StoreNumber'];
				suggestionMethod().subscribe((suggestions) => {
					this.getSuggestionSubject(controlName).next(suggestions);
					this.cdr.detectChanges();
				});
			}
		}
	}

	isFieldConfirmed(controlName: string): boolean {
		const currentValue = this.searchForm.get(controlName)?.value?.trim() || '';
		return this.confirmedFields[controlName] === currentValue && currentValue !== '';
	}

	getSuggestionSubject(controlName: string): BehaviorSubject<string[]> {
		return {
			Building: this.buildingSuggestions$,
			Floor: this.floorSuggestions$,
			Line: this.lineSuggestions$,
			StoreNumber: this.storeNumberSuggestions$,
		}[controlName as 'Building' | 'Floor' | 'Line' | 'StoreNumber'];
	}

	formatStore(store: PassByStoreResponseDto): string {
		return `${store.building} ${store.floor} ${store.line} ${store.storeNumber}`.trim();
	}

	getFirstPhotoUrl(pass: ContractorPassesDto): string {
		if (!pass.contractorPhotoPath) return '/assets/images/default-photo.jpg';
		const filePath = pass.contractorPhotoPath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return `${this.apiBaseUrl}/${filePath}`;
	}

	getLastDocumentPhotoUrl(contractor: ContractorPassesDto): string | null {
		if (!contractor.documentPhotos) return null;
		const photos = contractor.documentPhotos.split(',');
		const lastPhoto = photos[photos.length - 1];
		const filePath = lastPhoto.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return `${this.apiBaseUrl}/${filePath}`;
	}

	getLatestPass(passes: PassDetailsDto[]): PassDetailsDto | undefined {
		if (!passes || passes.length === 0) return undefined;
		return passes.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
	}

	getSortedPasses(passes: PassDetailsDto[], currentStore?: PassByStoreResponseDto): PassDetailsDto[] {
		if (!passes || passes.length === 0) return [];
		if (environment.debug) {
			passes.forEach((pass, index) => {
				if (!pass.passTypeColor) {
					console.warn(`[GetSortedPasses] Pass ${index} missing passTypeColor for ${pass.passTypeName}`);
				}
			});
		}
		if (!currentStore) {
			return passes.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
		}
		return passes.sort((a, b) => {
			const aMatchesCurrentStore =
				a.building === currentStore.building &&
				a.floor === currentStore.floor &&
				a.line === currentStore.line &&
				a.storeNumber === currentStore.storeNumber;
			const bMatchesCurrentStore =
				b.building === currentStore.building &&
				b.floor === currentStore.floor &&
				b.line === currentStore.line &&
				b.storeNumber === currentStore.storeNumber;

			if (aMatchesCurrentStore && !bMatchesCurrentStore) return -1;
			if (!aMatchesCurrentStore && bMatchesCurrentStore) return 1;
			return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
		});
	}

	getActiveContractors(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return result.contractors.filter((contractor) => contractor.activePasses && contractor.activePasses.length > 0);
	}

	viewContractor(contractorId: number): void {
		const url = this.router.serializeUrl(this.router.createUrlTree(['/contractors/details', contractorId]));
		window.open(url, '_blank');
	}

	editContractor(contractorId: number): void {
		const url = this.router.serializeUrl(this.router.createUrlTree(['/contractors/edit', contractorId]));
		window.open(url, '_blank');
	}

	extendPass(pass: PassDetailsDto, result: PassByStoreResponseDto): void {
		let newStartDate: Date;
		try {
			const previousEndDate = new Date(pass.endDate);
			if (isNaN(previousEndDate.getTime())) throw new Error(`Invalid date: ${pass.endDate}`);
			newStartDate = new Date(previousEndDate);
			newStartDate.setDate(newStartDate.getDate() + 1);
		} catch (error: any) {
			console.error('Date parse error:', error);
			this.setMessage(`Ошибка даты: ${error.message}`, 'error');
			this.cdr.markForCheck();
			return;
		}
		this.isLoading = true;
		this.cdr.markForCheck();
		forkJoin({
			contractor: this.transactionService.getContractorById(pass.contractorId),
			store: this.transactionService.getStoreByDetails(pass.building, pass.floor, pass.line, pass.storeNumber),
			passType: this.transactionService.getPassTypeById(pass.passTypeId),
		})
			.pipe(
				takeUntil(this.destroy$),
				catchError((err) => {
					console.error('Extend forkJoin error:', err);
					this.setMessage(`Ошибка продления: ${err?.error?.message || err?.message || 'Ошибка сервера'}`, 'error');
					this.isLoading = false;
					this.cdr.markForCheck();
					return of(null);
				})
			)
			.subscribe({
				next: (data) => {
					if (!data || !data.contractor || !data.store || !data.passType) {
						this.isLoading = false;
						if (!this.errorMessage) this.setMessage('Неполные данные для продления.', 'error');
						console.error('Incomplete extend data:', data);
						this.cdr.markForCheck();
						return;
					}
					const { contractor, store, passType } = data;
					const formattedStartDate = this.datePipe.transform(newStartDate, 'yyyy-MM-dd')!;
					const extendData = {
						contractorId: contractor.id,
						passTypeId: passType.id,
						store: {
							id: store.id,
							building: store.building || '',
							floor: store.floor || '',
							line: store.line || '',
							storeNumber: store.storeNumber || '',
						} as TransactionStore,
						startDate: formattedStartDate,
						position: pass.position || 'Employee',
						contractorDetails: {
							id: contractor.id,
							lastName: contractor.lastName || '',
							firstName: contractor.firstName || '',
							middleName: contractor.middleName || '',
							passportSerialNumber: contractor.passportSerialNumber || '',
						} as ContractorDto,
						passType: {
							id: passType.id,
							name: passType.name || '',
							durationInMonths: passType.durationInMonths || 0,
							cost: passType.cost || 0,
						} as PassType,
						originalPassId: pass.id,
					};
					this.isLoading = false;
					this.cdr.markForCheck();
					this.router.navigate(['/transactions/create'], { state: extendData });
				},
			});
	}

	closePass(passId: number): void {
		let pass: PassDetailsDto | undefined;
		for (const result of this.results) {
			for (const contractor of result.contractors) {
				pass = contractor.activePasses.find((p) => p.id === passId);
				if (pass) break;
			}
			if (pass) break;
		}

		if (!pass) {
			this.setMessage(`Пропуск с ID ${passId} не найден.`, 'error');
			this.cdr.markForCheck();
			return;
		}

		if (pass.isClosed) {
			this.setMessage(`Пропуск с ID ${passId} уже закрыт.`, 'error');
			this.cdr.markForCheck();
			return;
		}

		const closeReason = prompt('Укажите причину закрытия пропуска:');
		if (!closeReason) return;

		this.isLoading = true;
		this.cdr.markForCheck();

		const user = this.userService.getCurrentUser();
		const closedBy = user?.userName || 'Неизвестно';
		if (closedBy === 'Неизвестно') {
			console.warn('closedBy установлен как Неизвестно, пользователь:', user);
			this.setMessage('Не удалось определить пользователя. Пожалуйста, войдите снова.', 'error');
			this.isLoading = false;
			this.cdr.markForCheck();
			return;
		}

		this.passService.closePass(passId, closeReason, closedBy).subscribe({
			next: () => {
				console.debug('Пропуск успешно закрыт, closedBy:', closedBy);
				this.setMessage(`Пропуск закрыт. Закрыл: ${closedBy}, Когда: ${new Date().toLocaleString()}`, 'success');
				this.searchPasses();
				this.isLoading = false;
				this.cdr.markForCheck();
			},
			error: (err: any) => {
				console.error('Ошибка при закрытии пропуска:', err);
				this.isLoading = false;
				if (err.status === 400) {
					this.setMessage(`Пропуск закрыт (400). Закрыл: ${closedBy}, Когда: ${new Date().toLocaleString()}`, 'success');
					this.searchPasses();
				} else {
					this.setMessage('Ошибка закрытия пропуска: ' + (err.error?.message || 'Неизвестная ошибка'), 'error');
				}
				this.cdr.markForCheck();
			},
		});
	}

	toggleExpansionPanel(resultIndex: number, contractorIndex: number): void {
		const key = `${resultIndex}-${contractorIndex}`;
		this.panelStates[key] = !this.panelStates[key];
		this.cdr.markForCheck();
	}

	isExpanded(resultIndex: number, contractorIndex: number): boolean {
		const key = `${resultIndex}-${contractorIndex}`;
		return !!this.panelStates[key];
	}

	openImage(url: string | null): void {
		if (url) {
			window.open(url, '_blank');
		}
	}

	trackByFn(index: number, item: { contractor: ContractorPassesDto; isActive: boolean }): number {
		return item.contractor.contractorId;
	}

	goToCreateTransaction(): void {
		if (!this.isFieldConfirmed('Building') || !this.isFieldConfirmed('Floor') || !this.isFieldConfirmed('Line') || !this.isFieldConfirmed('StoreNumber')) {
			this.setMessage('Все поля должны быть заполнены и подтверждены.', 'error');
			this.cdr.markForCheck();
			return;
		}
		this.isLoading = true;
		this.cdr.markForCheck();
		const building = this.confirmedFields['Building']!;
		const floor = this.confirmedFields['Floor']!;
		const line = this.confirmedFields['Line']!;
		const storeNumber = this.confirmedFields['StoreNumber']!;
		this.transactionService
			.getStoreByDetails(building, floor, line, storeNumber)
			.pipe(
				takeUntil(this.destroy$),
				catchError((err) => {
					console.error('getStoreByDetails error:', err);
					this.setMessage(
						err.status === 404
							? `Торговая точка ${building}-${floor}-${line}-${storeNumber} не найдена.`
							: `Ошибка получения данных торговой точки: ${err.message || 'Ошибка'}`,
						'error'
					);
					this.isLoading = false;
					this.cdr.markForCheck();
					return of(null);
				})
			)
			.subscribe({
				next: (store: TransactionStore | null) => {
					this.isLoading = false;
					if (!store) {
						if (!this.errorMessage) this.setMessage('Торговая точка не найдена.', 'error');
						this.cdr.markForCheck();
						return;
					}
					const storeData: TransactionStore = {
						id: store.id,
						building: store.building || '',
						floor: store.floor || '',
						line: store.line || '',
						storeNumber: store.storeNumber || '',
					};
					this.router.navigate(['/transactions/create'], { state: { store: storeData } });
					this.cdr.markForCheck();
				},
			});
	}

	getNameParts(fullName: string): string[] {
		if (!fullName) return ['', '', ''];
		const parts = fullName.trim().split(' ');
		return [parts[0] || '', parts[1] || '', parts.slice(2).join(' ') || ''];
	}
}