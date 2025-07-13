import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of, Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { PassService } from '../../services/pass.service';
import { TransactionService } from '../../services/transaction.service';
import { HistoryService } from '../../services/history.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { SearchFilterResetService } from '../../services/search-filter-reset.service';
import { QueueSyncService } from '../../services/queue-sync.service';
import { Router } from '@angular/router';
import { PassByStoreResponseDto, ContractorPassesDto, PassDetailsDto, SearchCriteria } from '../../models/store-pass-search.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { HistoryEntry, ChangeValue } from '../../models/history.model';
import { Store } from '../../models/store.model';
import { StoreService } from '../../services/store.service';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

const PAGE_SIZE = 500;
const DEBOUNCE_TIME_MS = 300;
const INTERSECTION_THRESHOLD = 0.1;
const ROOT_MARGIN = '1000px';
const API_BASE_URL = 'http://localhost:8080';
const DEFAULT_PHOTO_URL = '/assets/images/default-photo.jpg';
const ANIMATION_DURATION = '300ms';
const ANIMATION_EASING = 'ease-out';
const TRANSFORM_START = 'translateY(20px)';
const TRANSFORM_END = 'translateY(0)';
const OPACITY_START = 0;
const OPACITY_END = 1;
const TOTAL_COUNT_DEFAULT = -1;
const INITIAL_PAGE = 1;
const DATE_OFFSET_DAYS = 0;
const STORAGE_KEY_CRITERIA = 'storeSearchCriteria';
const STORAGE_KEY_SCROLL = 'storePassScrollPosition';
const STORAGE_KEY_PANEL = 'storePassPanelStates';
const DEFAULT_POSITION = 'Наёмный работник';
const PATH_SEPARATOR = '/';
const WWWROOT_PREFIX = 'wwwroot';
const ERROR_ALL_FIELDS = 'Выберите значения для всех полей';
const ERROR_SERVER = 'Ошибка сервера';
const ERROR_INVALID_DATE = 'Неверный формат даты окончания предыдущего пропуска';
const ERROR_NO_CONTRACTOR = 'Не удалось получить все данные (контрагент, магазин или тип пропуска) для продления';
const ERROR_NO_PASS = 'Пропуск с ID {0} не найден';
const ERROR_PASS_CLOSED = 'Пропуск с ID {0} уже закрыт';
const ERROR_NO_REASON = 'Причина закрытия не указана';
const ERROR_NO_USER = 'Не удалось определить пользователя. Пожалуйста, войдите снова';
const ERROR_NO_STORE = 'Не удалось найти магазин для создания пропуска';
const ERROR_UNKNOWN = 'Неизвестная ошибка сервера';
const LOG_OBSERVE_TRIGGER = 'Observing loadMoreTrigger';
const LOG_TRIGGER_NOT_FOUND = 'loadMoreTrigger is not available in ngAfterViewInit';
const LOG_INTERSECTION = 'IntersectionObserver triggered: Loading more results';
const LOG_SCROLL_DEBOUNCE = 'Scroll debounce triggered: isLoading={0}, hasMoreResults={1}';
const LOG_SEARCH_BLOCKED = 'Search blocked: isLoading is true';
const LOG_FORM_CHANGED = 'Form value changed, triggering search';
const LOG_CACHE_USED = 'Using cached data for key: {0}';
const LOG_SEARCH_RESPONSE = 'Search response:';
const LOG_NO_CONTRACTORS = 'No contractors found, stopping infinite scroll';
const LOG_SEARCH_ERROR = 'Search error:';
const LOG_FLATTENED = 'Flattened results:';
const LOG_RESPONSE_DETAILS = 'handleSearchResponse:';
const LOG_LOAD_MORE = 'loadMoreResults called';
const LOG_INVALID_DATE_ERROR = 'Ошибка парсинга даты окончания пропуска:';
const LOG_FORKJOIN_ERROR = 'Ошибка при загрузке данных для продления через forkJoin:';
const LOG_EXTEND_DATA = 'Подготовлены данные для передачи в state:';

@Component({
	selector: 'app-store-pass-search',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatAutocompleteModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatExpansionModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatCheckboxModule,
		MatTableModule,
		MatCardModule,
		MatDividerModule,
		MatTooltipModule
	],
	templateUrl: './store-pass-search.component.html',
	styleUrls: ['./store-pass-search.component.css'],
	animations: [
		trigger('fadeIn', [
			transition(':enter', [
				style({ opacity: OPACITY_START, transform: TRANSFORM_START }),
				animate(`${ANIMATION_DURATION} ${ANIMATION_EASING}`, style({ opacity: OPACITY_END, transform: TRANSFORM_END }))
			])
		])
	]
})
export class StorePassSearchComponent implements OnInit, OnDestroy {
	@ViewChild('loadMoreTrigger') loadMoreTrigger!: ElementRef;
	@ViewChild('noteTextarea') noteTextarea!: ElementRef<HTMLTextAreaElement>;
	store: Store | null = null;
	searchForm: FormGroup;
	flattenedContractors: { store: PassByStoreResponseDto; contractor: ContractorPassesDto; isActive: boolean }[] = [];
	isLoading = false;
	isLoadingHistory = false;
	noteForm: FormGroup;
	showHistory = false;
	userMap: { [key: string]: string } = {};
	historyEntries = new MatTableDataSource<HistoryEntry>([]);
	errorMessage: string | null = null;
	successMessage: string | null = null;
	page = INITIAL_PAGE;
	totalCount = TOTAL_COUNT_DEFAULT;
	hasMoreResults = true;
	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);
	historyColumns: string[] = ['timestamp', 'action', 'user', 'details', 'changes'];
	private subscriptions: Subscription[] = [];
	private confirmedFields: { [key: string]: string | null } = {
		Building: null,
		Floor: null,
		Line: null,
		StoreNumber: null
	};
	private pageCache: { [key: string]: PassByStoreResponseDto[] } = {};
	private panelStates = new Map<string, boolean>();
	private intersectionObserver: IntersectionObserver;
	private scrollSubject = new Subject<void>();
	private destroy$ = new Subject<void>();
	private historyLoad$ = new Subject<string>();

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private passService: PassService,
		private historyService: HistoryService,
		private authService: AuthService,
		private transactionService: TransactionService,
		private userService: UserService,
		private searchFilterResetService: SearchFilterResetService,
		private queueSyncService: QueueSyncService,
		private router: Router,
		private cdr: ChangeDetectorRef
	) {
		this.searchForm = this.fb.group({
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: [''],
			showActive: [true],
			showClosed: [false]
		});

		this.intersectionObserver = new IntersectionObserver(
			(entries) => this.handleIntersection(entries),
			{ threshold: INTERSECTION_THRESHOLD, rootMargin: ROOT_MARGIN }
		);

		this.noteForm = this.fb.group({
			note: ['', [Validators.maxLength(500)]],
		});
	}

	ngOnInit(): void {
		this.loadCurrentUser();
		this.loadUsersFromTransactions();
		this.loadStoredSearchCriteria();
		this.initializeAutocompleteHandlers();
		this.initializeFormSubscriptions();
		this.initializeScrollDebounce();
		this.initializeResetSubscription();
		this.initializeHistoryLoad();
		if (this.areAllFieldsConfirmed()) {
			this.loadStore();
			this.searchPasses(true);
		}
	}

	ngAfterViewInit(): void {
		if (this.loadMoreTrigger?.nativeElement) {
			console.log(LOG_OBSERVE_TRIGGER);
			this.intersectionObserver.observe(this.loadMoreTrigger.nativeElement);
		} else {
			console.error(LOG_TRIGGER_NOT_FOUND);
		}
		this.restoreScrollPosition();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
		this.intersectionObserver.disconnect();
		this.destroy$.next();
		this.destroy$.complete();
		this.historyLoad$.complete();
	}

	private loadCurrentUser(): void {
		const user = this.userService.getCurrentUser();
		if (user && user.id && user.userName) {
			this.userMap[user.id] = user.userName;
		}
	}

	private loadUsersFromTransactions(): void {
		const sub = this.transactionService.searchTransactions({}, 1, 100).subscribe({
			next: (result) => {
				result.transactions.forEach((t: any) => {
					if (t.user && t.userId && t.user.userName) {
						this.userMap[t.userId] = t.user.userName;
					}
				});
				this.cdr.markForCheck();
			},
			error: (err) => console.error('Ошибка загрузки пользователей из транзакций:', err),
		});
		this.subscriptions.push(sub);
	}

	private initializeResetSubscription(): void {
		this.subscriptions.push(
			this.searchFilterResetService.resetTrigger$.subscribe((reset) => {
				if (reset) {
					this.resetFilters();
					this.searchFilterResetService.consumeReset();
				}
			})
		);
	}

	private handleIntersection(entries: IntersectionObserverEntry[]): void {
		entries.forEach(entry => {
			if (entry.isIntersecting && !this.isLoading && this.hasMoreResults) {
				console.log(LOG_INTERSECTION);
				this.scrollSubject.next();
			}
		});
	}

	private initializeScrollDebounce(): void {
		this.subscriptions.push(
			this.scrollSubject.pipe(
				debounceTime(DEBOUNCE_TIME_MS),
				takeUntil(this.destroy$)
			).subscribe(() => {
				console.log(LOG_SCROLL_DEBOUNCE.replace('{0}', this.isLoading.toString()).replace('{1}', this.hasMoreResults.toString()));
				if (!this.isLoading && this.hasMoreResults) {
					this.loadMoreResults();
				}
			})
		);
	}

	private initializeFormSubscriptions(): void {
		this.subscriptions.push(
			this.searchForm.valueChanges.pipe(
				debounceTime(DEBOUNCE_TIME_MS),
				distinctUntilChanged(),
				takeUntil(this.destroy$)
			).subscribe(() => {
				if (this.areAllFieldsConfirmed()) {
					console.log(LOG_FORM_CHANGED);
					this.searchPasses(true);
				}
			})
		);
	}

	private loadStoredSearchCriteria(): void {
		const storedCriteria = localStorage.getItem(STORAGE_KEY_CRITERIA);
		if (storedCriteria) {
			const criteria = JSON.parse(storedCriteria);
			this.searchForm.patchValue({
				Building: criteria.building || '',
				Floor: criteria.floor || '',
				Line: criteria.line || '',
				StoreNumber: criteria.storeNumber || '',
				showActive: criteria.showActive ?? true,
				showClosed: criteria.showClosed ?? false
			});
			this.confirmedFields = {
				Building: criteria.building || null,
				Floor: criteria.floor || null,
				Line: criteria.line || null,
				StoreNumber: criteria.storeNumber || null
			};
			this.searchPasses(true);
		}
	}

	private loadStore(): void {
		if (!this.areAllFieldsConfirmed()) {
			console.warn('Не все поля подтверждены для загрузки магазина', this.confirmedFields);
			return;
		}
		this.isLoading = true;
		this.store = null;
		const criteria = {
			building: this.confirmedFields['Building'] || '',
			floor: this.confirmedFields['Floor'] || '',
			line: this.confirmedFields['Line'] || '',
			storeNumber: this.confirmedFields['StoreNumber'] || ''
		};
		console.log('Запрос магазина с параметрами:', criteria);
		this.transactionService.getStoreByDetails(
			criteria.building,
			criteria.floor,
			criteria.line,
			criteria.storeNumber
		).subscribe({
			next: (store) => {
				console.log('Получен магазин:', store);
				this.store = store;
				this.noteForm.patchValue({ note: store.note || '' }, { emitEvent: false });
				this.noteForm.markAsPristine();
				this.isLoading = false;
				if (this.showHistory) {
					this.loadHistory(store.id.toString());
				}
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error('Ошибка при загрузке магазина:', err);
				this.errorMessage = ERROR_NO_STORE;
				this.isLoading = false;
				this.cdr.markForCheck();
			}
		});
	}

	private saveSearchCriteria(): void {
		const criteria = {
			building: this.confirmedFields['Building'] || '',
			floor: this.confirmedFields['Floor'] || '',
			line: this.confirmedFields['Line'] || '',
			storeNumber: this.confirmedFields['StoreNumber'] || '',
			showActive: this.searchForm.get('showActive')?.value ?? true,
			showClosed: this.searchForm.get('showClosed')?.value ?? false
		};
		localStorage.setItem(STORAGE_KEY_CRITERIA, JSON.stringify(criteria));
	}

	private flattenResults(results: PassByStoreResponseDto[], showActive: boolean, showClosed: boolean): { store: PassByStoreResponseDto; contractor: ContractorPassesDto; isActive: boolean }[] {
		const flattened: { store: PassByStoreResponseDto; contractor: ContractorPassesDto; isActive: boolean }[] = [];
		const contractorIds = new Set<number>();

		results.forEach(store => {
			const contractors = store.contractors ?? [];
			contractors.forEach(contractor => {
				const activePassesForStore = (contractor.activePasses ?? []).filter(pass =>
					pass.building === store.building &&
					pass.floor === store.floor &&
					pass.line === store.line &&
					pass.storeNumber === store.storeNumber
				);
				const closedPassesForStore = (contractor.closedPasses ?? []).filter(pass =>
					pass.building === store.building &&
					pass.floor === store.floor &&
					pass.line === store.line &&
					pass.storeNumber === store.storeNumber
				);

				const hasActivePassesForStore = activePassesForStore.length > 0;
				const hasClosedPassesForStore = closedPassesForStore.length > 0;

				if (showActive && hasActivePassesForStore && !contractorIds.has(contractor.contractorId)) {
					flattened.push({ store, contractor, isActive: true });
					contractorIds.add(contractor.contractorId);
				}
				else if (showClosed && hasClosedPassesForStore && !hasActivePassesForStore && !contractorIds.has(contractor.contractorId)) {
					flattened.push({ store, contractor, isActive: false });
					contractorIds.add(contractor.contractorId);
				}
			});
		});

		console.log(LOG_FLATTENED, flattened.map(item => ({ contractorId: item.contractor.contractorId, isActive: item.isActive })));
		return flattened;
	}

	public areAllFieldsConfirmed(): boolean {
		return Object.values(this.confirmedFields).every(value => value !== null && value.trim() !== '');
	}

	public isFieldConfirmed(controlName: string): boolean {
		const currentValue = this.searchForm.get(controlName)?.value?.trim() || '';
		return this.confirmedFields[controlName] === currentValue && currentValue !== '';
	}

	private searchPasses(isInitialSearch: boolean): void {
		if (!this.areAllFieldsConfirmed()) {
			this.errorMessage = ERROR_ALL_FIELDS;
			this.flattenedContractors = [];
			this.cdr.markForCheck();
			return;
		}

		if (this.isLoading) {
			console.log(LOG_SEARCH_BLOCKED);
			return;
		}

		this.isLoading = true;
		this.errorMessage = null;
		const criteria = this.prepareSearchCriteria(isInitialSearch);
		console.log(LOG_SEARCH_RESPONSE, criteria);

		if (isInitialSearch) {
			this.pageCache = {};
			this.flattenedContractors = [];
			this.page = INITIAL_PAGE;
			this.hasMoreResults = true;
			sessionStorage.removeItem(STORAGE_KEY_SCROLL);
			sessionStorage.removeItem(STORAGE_KEY_PANEL);
			this.loadStore(); // Вызываем loadStore для обновления this.store
		}

		const cacheKey = this.getCacheKey(criteria);
		if (this.pageCache[cacheKey]) {
			console.log(LOG_CACHE_USED.replace('{0}', cacheKey));
			this.handleSearchResponse(this.pageCache[cacheKey], isInitialSearch);
			return;
		}

		this.passService.searchPassesByStore(criteria).subscribe({
			next: (response: PassByStoreResponseDto[]) => {
				console.log(LOG_SEARCH_RESPONSE, response);
				if (!response || response.every(r => !r.contractors || r.contractors.length === 0)) {
					this.errorMessage = null;
					this.flattenedContractors = [];
					this.totalCount = response[0]?.totalCount || 0;
					this.hasMoreResults = false;
					this.isLoading = false;
					this.cdr.markForCheck();
					console.log(LOG_NO_CONTRACTORS);
					return;
				}
				this.pageCache[cacheKey] = response;
				this.handleSearchResponse(response, isInitialSearch);
			},
			error: (error) => {
				console.error(LOG_SEARCH_ERROR, error);
				this.errorMessage = ERROR_SERVER;
				this.isLoading = false;
				this.flattenedContractors = [];
				this.totalCount = TOTAL_COUNT_DEFAULT;
				this.cdr.markForCheck();
			}
		});
	}

	private getCacheKey(criteria: SearchCriteria): string {
		return `${criteria.building}_${criteria.floor}_${criteria.line}_${criteria.storeNumber}_${criteria.showActive}_${criteria.showClosed}_${criteria.page}`;
	}

	private handleSearchResponse(response: PassByStoreResponseDto[], isInitialSearch: boolean): void {
		const showActive = this.searchForm.get('showActive')?.value;
		const showClosed = this.searchForm.get('showClosed')?.value;
		const newFlattened = this.flattenResults(response, showActive, showClosed);

		console.log(LOG_RESPONSE_DETAILS, {
			responseLength: response.length,
			totalCount: response[0]?.totalCount,
			newFlattenedLength: newFlattened.length,
			flattenedContractorsLength: this.flattenedContractors.length,
			hasMoreResults: this.hasMoreResults,
			page: this.page
		});

		if (isInitialSearch) {
			this.flattenedContractors = newFlattened;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			const existingIds = new Set(this.flattenedContractors.map(c => c.contractor.contractorId));
			const filteredNewFlattened = newFlattened.filter(c => !existingIds.has(c.contractor.contractorId));
			this.flattenedContractors = [...this.flattenedContractors, ...filteredNewFlattened];
		}

		this.totalCount = response[0]?.totalCount || 0;
		this.hasMoreResults = this.flattenedContractors.length < this.totalCount && response.length > 0;
		this.page = isInitialSearch ? INITIAL_PAGE : this.page + 1;

		console.log('After update:', {
			totalCount: this.totalCount,
			flattenedContractorsLength: this.flattenedContractors.length,
			hasMoreResults: this.hasMoreResults,
			page: this.page
		});

		this.isLoading = false;
		this.cdr.markForCheck();
	}

	private loadMoreResults(): void {
		console.log(LOG_LOAD_MORE);
		this.searchPasses(false);
	}

	private prepareSearchCriteria(isInitialSearch: boolean): SearchCriteria {
		const targetPage = isInitialSearch ? INITIAL_PAGE : this.page + 1;
		const criteria: SearchCriteria = {
			building: this.confirmedFields['Building'] || '',
			floor: this.confirmedFields['Floor'] || '',
			line: this.confirmedFields['Line'] || '',
			storeNumber: this.confirmedFields['StoreNumber'] || '',
			showActive: this.searchForm.get('showActive')?.value ?? true,
			showClosed: this.searchForm.get('showClosed')?.value ?? false,
			page: targetPage,
			pageSize: PAGE_SIZE
		};
		if (isInitialSearch) {
			this.saveSearchCriteria();
		}
		return criteria;
	}

	private restoreScrollPosition(): void {
		const scrollPosition = sessionStorage.getItem(STORAGE_KEY_SCROLL);
		const storedPanelStates = sessionStorage.getItem(STORAGE_KEY_PANEL);
		if (scrollPosition) {
			window.scrollTo({ top: +scrollPosition, behavior: 'smooth' });
			sessionStorage.removeItem(STORAGE_KEY_SCROLL);
		}
		if (storedPanelStates) {
			this.panelStates = new Map(JSON.parse(storedPanelStates));
			sessionStorage.removeItem(STORAGE_KEY_PANEL);
		}
		this.cdr.markForCheck();
	}

	public resetFilters(): void {
		this.searchForm.reset({ showActive: true, showClosed: false });
		this.confirmedFields = { Building: null, Floor: null, Line: null, StoreNumber: null };
		localStorage.removeItem(STORAGE_KEY_CRITERIA);
		this.flattenedContractors = [];
		this.errorMessage = null;
		this.page = INITIAL_PAGE;
		this.hasMoreResults = true;
		this.pageCache = {};
		this.totalCount = TOTAL_COUNT_DEFAULT;
		this.cdr.markForCheck();
	}

	public initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', this.passService.getBuildingSuggestions.bind(this.passService));
		this.setupAutocomplete('Floor', this.passService.getFloorSuggestions.bind(this.passService));
		this.setupAutocomplete('Line', this.passService.getLineSuggestions.bind(this.passService));
		this.setupAutocomplete('StoreNumber', this.passService.getStoreNumberSuggestions.bind(this.passService));
	}

	public setupAutocomplete(controlName: string, suggestionServiceMethod: (query: string) => Observable<string[]>): void {
		const control = this.searchForm.get(controlName);
		if (control) {
			this.subscriptions.push(
				control.valueChanges.pipe(
					debounceTime(DEBOUNCE_TIME_MS),
					distinctUntilChanged(),
					takeUntil(this.destroy$),
					switchMap(query => {
						const trimmedQuery = query?.trim() || '';
						if (this.confirmedFields[controlName] === trimmedQuery) return of([]);
						if (!trimmedQuery) {
							this.confirmedFields[controlName] = null;
							return of([]);
						}
						return suggestionServiceMethod(trimmedQuery).pipe(catchError(() => of([])));
					})
				).subscribe(suggestions => this.getSuggestionSubject(controlName).next(suggestions))
			);
		}
	}

	public onInput(controlName: string, event: Event): void {
		const value = (event.target as HTMLInputElement).value.trim();
		if (!this.confirmedFields[controlName] || this.confirmedFields[controlName] !== value) {
			this.confirmedFields[controlName] = null;
		}
	}

	public selectSuggestion(controlName: string, value: string): void {
		this.searchForm.get(controlName)?.setValue(value);
		this.confirmedFields[controlName] = value;
		this.getSuggestionSubject(controlName).next([]);
		this.searchPasses(true);
	}

	public getSuggestionSubject(controlName: string): BehaviorSubject<string[]> {
		const subjects: { [key: string]: BehaviorSubject<string[]> } = {
			Building: this.buildingSuggestions$,
			Floor: this.floorSuggestions$,
			Line: this.lineSuggestions$,
			StoreNumber: this.storeNumberSuggestions$
		};
		return subjects[controlName] || new BehaviorSubject<string[]>([]);
	}

	public formatStore(store: PassByStoreResponseDto): string {
		return `${store.building} ${store.floor} ${store.line} ${store.storeNumber}`.trim();
	}

	public formatPassStore(pass: PassDetailsDto): string {
		return `${pass.building} ${pass.floor} ${pass.line} ${pass.storeNumber}`.trim();
	}

	public getAbsolutePhotoUrl(relativePath: string | null): string | null {
		if (!relativePath) {
			return null;
		}
		const cleanedPath = relativePath.replace(/\\/g, PATH_SEPARATOR).replace(new RegExp(`^.*${WWWROOT_PREFIX}${PATH_SEPARATOR}`), '');
		return `${API_BASE_URL}${PATH_SEPARATOR}${cleanedPath}`;
	}

	public getLatestPass(passes: PassDetailsDto[] | undefined): PassDetailsDto | undefined {
		if (!passes || passes.length === 0) return undefined;
		return passes.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
	}

	public getSortedPasses(contractor: ContractorPassesDto, store: PassByStoreResponseDto): PassDetailsDto[] {
		const showActive = this.searchForm.get('showActive')?.value ?? true;
		const showClosed = this.searchForm.get('showClosed')?.value ?? false;

		let passes: PassDetailsDto[] = [];

		if (showActive && !showClosed) {
			passes = (contractor.activePasses ?? []);
		} else if (showClosed) {
			const closedPassesForStore = (contractor.closedPasses ?? []).filter(pass =>
				pass.building === store.building &&
				pass.floor === store.floor &&
				pass.line === store.line &&
				pass.storeNumber === store.storeNumber
			);
			passes = [
				...(contractor.activePasses ?? []),
				...closedPassesForStore
			];
		}

		return passes.sort((a, b) => {
			return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
		});
	}

	public getActiveContractors(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return (result.contractors ?? []).filter(contractor => (contractor.activePasses ?? []).length > 0);
	}

	public getClosedContractors(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return (result.contractors ?? []).filter(contractor =>
			(contractor.closedPasses ?? []).some(pass =>
				pass.building === result.building &&
				pass.floor === result.floor &&
				pass.line === result.line &&
				pass.storeNumber === result.storeNumber
			) &&
			!(contractor.activePasses ?? []).some(pass =>
				pass.building === result.building &&
				pass.floor === result.floor &&
				pass.line === result.line &&
				pass.storeNumber === result.storeNumber
			)
		);
	}

	private addMonths(date: Date, months: number): Date {
		const newDate = new Date(date);
		newDate.setMonth(newDate.getMonth() + months);
		return newDate;
	}

	private formatDateToYYYYMMDD(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	public viewContractor(contractorId: number): void {
		sessionStorage.setItem(STORAGE_KEY_SCROLL, window.scrollY.toString());
		sessionStorage.setItem(STORAGE_KEY_PANEL, JSON.stringify(Array.from(this.panelStates.entries())));
		this.router.navigate(['/contractors/details', contractorId]);
	}

	public editContractor(contractorId: number): void {
		sessionStorage.setItem(STORAGE_KEY_SCROLL, window.scrollY.toString());
		sessionStorage.setItem(STORAGE_KEY_PANEL, JSON.stringify(Array.from(this.panelStates.entries())));
		this.router.navigate(['/contractors/edit', contractorId]);
	}

	public extendPass(pass: PassDetailsDto, store: PassByStoreResponseDto): void {
		let newStartDate: Date;
		try {
			const previousEndDate = new Date(pass.endDate);
			if (isNaN(previousEndDate.getTime())) {
				throw new Error(LOG_INVALID_DATE_ERROR);
			}
			newStartDate = new Date(previousEndDate);
			newStartDate.setDate(newStartDate.getDate() + DATE_OFFSET_DAYS);
		} catch (error) {
			console.error(LOG_INVALID_DATE_ERROR, error);
			this.errorMessage = ERROR_INVALID_DATE;
			this.cdr.markForCheck();
			return;
		}

		this.isLoading = true;
		this.errorMessage = null;

		forkJoin({
			contractor: this.transactionService.getContractorById(pass.contractorId),
			store: this.transactionService.getStoreByDetails(pass.building, pass.floor, pass.line, pass.storeNumber),
			passType: this.transactionService.getPassTypeById(pass.passTypeId)
		}).subscribe({
			next: ({ contractor, store, passType }) => {
				if (!contractor || !store || !passType) {
					console.error(ERROR_NO_CONTRACTOR, { contractor, store, passType });
					this.errorMessage = ERROR_NO_CONTRACTOR;
					this.isLoading = false;
					this.cdr.markForCheck();
					return;
				}

				const extendData = {
					contractorId: contractor.id,
					passTypeId: passType.id,
					store: {
						id: store.id,
						building: store.building,
						floor: store.floor,
						line: store.line,
						storeNumber: store.storeNumber
					},
					startDate: newStartDate.toISOString(),
					position: pass.position || DEFAULT_POSITION,
					contractorDetails: {
						id: contractor.id,
						lastName: contractor.lastName || '',
						firstName: contractor.firstName || '',
						middleName: contractor.middleName || '',
						passportSerialNumber: contractor.passportSerialNumber || ''
					},
					passType: {
						id: passType.id,
						name: passType.name,
						durationInMonths: passType.durationInMonths,
						cost: passType.cost
					}
				};

				console.log(LOG_EXTEND_DATA, extendData);

				this.isLoading = false;
				this.router.navigate(['/transactions/create'], { state: extendData });
			},
			error: (err) => {
				console.error(LOG_FORKJOIN_ERROR, err);
				const message = err?.error?.message || err?.message || ERROR_UNKNOWN;
				this.errorMessage = `Ошибка при загрузке данных для продления: ${message}`;
				this.isLoading = false;
				this.cdr.markForCheck();
			}
		});
	}

	public closePass(passId: number): void {
		let pass: PassDetailsDto | undefined;
		let contractorIndex: number | undefined;
		let contractor: ContractorPassesDto | undefined;
		let store: PassByStoreResponseDto | undefined;

		for (let i = 0; i < this.flattenedContractors.length; i++) {
			const item = this.flattenedContractors[i];
			pass = [
				...(item.contractor.activePasses ?? []),
				...(item.contractor.closedPasses ?? [])
			].find(p => p.id === passId);
			if (pass) {
				contractorIndex = i;
				contractor = item.contractor;
				store = item.store;
				break;
			}
		}

		if (!pass || !contractor || contractorIndex === undefined || !store) {
			this.errorMessage = ERROR_NO_PASS.replace('{0}', passId.toString());
			this.cdr.markForCheck();
			return;
		}
		if (pass.isClosed) {
			this.errorMessage = ERROR_PASS_CLOSED.replace('{0}', passId.toString());
			this.cdr.markForCheck();
			return;
		}

		const reason = prompt('Укажите причину закрытия пропуска:');
		if (!reason) {
			this.errorMessage = ERROR_NO_REASON;
			this.cdr.markForCheck();
			return;
		}

		const user = this.userService.getCurrentUser();
		const closedBy = user?.id;
		if (!closedBy || !user?.userName) {
			this.errorMessage = ERROR_NO_USER;
			this.cdr.markForCheck();
			return;
		}

		this.isLoading = true;
		const sub = this.passService.closePass(passId, reason, closedBy).subscribe({
			next: () => {
				const updatedActivePasses = (contractor.activePasses ?? []).filter(p => p.id !== passId);
				const updatedClosedPasses = [
					...(contractor.closedPasses ?? []),
					{ ...pass, isClosed: true }
				];

				this.flattenedContractors[contractorIndex] = {
					...this.flattenedContractors[contractorIndex],
					contractor: {
						...contractor,
						activePasses: updatedActivePasses,
						closedPasses: updatedClosedPasses
					}
				};

				if (!this.searchForm.get('showClosed')?.value && updatedActivePasses.length === 0) {
					this.flattenedContractors = this.flattenedContractors.filter(
						item => item.contractor.contractorId !== contractor.contractorId
					);
				}

				this.pageCache = {};

				this.isLoading = false;
				this.cdr.markForCheck();

				this.searchPasses(true);
			},
			error: (err) => {
				this.errorMessage = 'Не удалось закрыть пропуск: ' + (err.error?.message || ERROR_UNKNOWN);
				this.isLoading = false;
				this.cdr.markForCheck();
			}
		});
		this.subscriptions.push(sub);
	}

	public addPass(): void {
		if (!this.areAllFieldsConfirmed()) {
			this.errorMessage = ERROR_ALL_FIELDS;
			this.cdr.markForCheck();
			return;
		}

		this.isLoading = true;
		this.errorMessage = null;

		this.transactionService.getStoreByDetails(
			this.confirmedFields['Building'] || '',
			this.confirmedFields['Floor'] || '',
			this.confirmedFields['Line'] || '',
			this.confirmedFields['StoreNumber'] || ''
		).subscribe({
			next: (store) => {
				if (!store) {
					this.errorMessage = ERROR_NO_STORE;
					this.isLoading = false;
					this.cdr.markForCheck();
					return;
				}

				const addData = {
					store: {
						id: store.id,
						building: store.building,
						floor: store.floor,
						line: store.line,
						storeNumber: store.storeNumber
					}
				};

				this.isLoading = false;
				this.router.navigate(['/transactions/create'], { state: addData });
			},
			error: (err) => {
				const message = err?.error?.message || err?.message || ERROR_UNKNOWN;
				this.errorMessage = `Ошибка при загрузке данных магазина: ${message}`;
				this.isLoading = false;
				this.cdr.markForCheck();
			}
		});
	}

	public togglePanel(contractorId: number, type: 'active' | 'closed'): void {
		const key = `${contractorId}-${type}`;
		const currentState = this.panelStates.get(key) || false;
		this.panelStates.set(key, !currentState);
		this.cdr.markForCheck();
	}

	public isPanelExpanded(contractorId: number, type: 'active' | 'closed'): boolean {
		const key = `${contractorId}-${type}`;
		return this.panelStates.get(key) || false;
	}

	public openImageInNewWindow(url: string | null): void {
		if (url) window.open(url, '_blank');
	}

	public trackByContractor(index: number, item: { contractor: ContractorPassesDto }): number {
		return item.contractor.contractorId;
	}

	get note(): string {
		return this.noteForm.get('note')?.value || '';
	}

	saveNote(): void {
		if (!this.store || !this.noteForm.valid) {
			console.warn('Сохранение невозможно: store=', this.store, 'noteForm.valid=', this.noteForm.valid);
			return;
		}

		const note = this.noteForm.get('note')?.value?.trim() || null;
		console.log('Сравнение заметок: note=', note, 'store.note=', this.store.note);

		if (note === this.store.note) {
			console.log('Заметка не изменилась, сохранение не требуется');
			return;
		}

		this.isLoading = true;
		const subscription = this.storeService.updateStoreNote(this.store.id, note).pipe(
			switchMap(() => {
				this.store = { ...this.store!, note }; // Временное обновление, будет синхронизировано при загрузке
				this.noteForm.patchValue({ note: note || '' }, { emitEvent: false });
				this.noteForm.markAsPristine();
				this.successMessage = note ? 'Заметка успешно сохранена' : 'Заметка успешно очищена';
				if (this.showHistory) {
					return this.historyService.getHistory('store', this.store!.id.toString()).pipe(
						catchError(err => {
							console.error('Ошибка при загрузке истории после сохранения заметки:', err);
							this.errorMessage = 'Не удалось обновить историю изменений.';
							this.historyEntries.data = [];
							return of({ generalHistory: [] });
						})
					);
				}
				return of({ generalHistory: this.historyEntries.data });
			})
		).subscribe({
			next: (response) => {
				if (this.showHistory) {
					const historyEntries = Array.isArray(response) ? response : response.generalHistory || [];
					console.log('Длина historyEntries.data до обновления:', this.historyEntries.data.length);
					this.historyEntries.data = [...historyEntries];
					console.log('Длина historyEntries.data после обновления:', this.historyEntries.data.length);
					if (historyEntries.length === 0) {
						console.debug('История для торговой точки пуста');
					}
				}
				this.isLoading = false;
				this.cdr.detectChanges();
			},
			error: (err) => {
				this.errorMessage = 'Ошибка при сохранении заметки: ' + (err.message || 'Неизвестная ошибка');
				console.error('Ошибка API:', err);
				this.isLoading = false;
				this.cdr.detectChanges();
			}
		});

		this.subscriptions.push(subscription);
	}

	clearNote(): void {
		this.noteForm.patchValue({ note: '' }, { emitEvent: true });
		this.noteForm.markAsDirty();
		this.noteForm.markAsTouched();
		this.cdr.markForCheck();
		console.log('Поле заметки очищено: noteForm.value=', this.noteForm.get('note')?.value);
	}

	private initializeHistoryLoad(): void {
		this.subscriptions.push(
			this.historyLoad$.pipe(
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(storeId => {
					console.log(`Начинаем загрузку истории для storeId: ${storeId}`);
					this.isLoadingHistory = true;
					this.errorMessage = null;
					this.cdr.markForCheck();
					return this.historyService.getHistory('store', storeId).pipe(
						catchError(err => {
							console.error('Ошибка при загрузке истории:', err);
							this.isLoadingHistory = false;
							this.errorMessage = err.message || 'Не удалось загрузить историю изменений.';
							this.historyEntries.data = [];
							this.cdr.markForCheck();
							return of({ generalHistory: [] });
						})
					);
				}),
				takeUntil(this.destroy$)
			).subscribe(response => {
				console.debug('Получен ответ API истории:', response);
				const historyEntries = Array.isArray(response) ? response : response.generalHistory || [];
				console.log('Длина historyEntries.data до обновления:', this.historyEntries.data.length);
				this.historyEntries.data = [...historyEntries];
				console.log('Длина historyEntries.data после обновления:', this.historyEntries.data.length);
				this.isLoadingHistory = false;
				if (historyEntries.length === 0) {
					console.debug(`История для торговой точки пуста`);
				}
				this.cdr.detectChanges();
			})
		);
	}

	loadHistory(storeId: string): void {
		console.log(`Инициируем загрузку истории для storeId: ${storeId}`);
		this.historyLoad$.next(storeId);
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

	toggleHistory(): void {
		this.showHistory = !this.showHistory;
		console.log('toggleHistory: showHistory=', this.showHistory, 'store=', this.store?.id);
		if (this.showHistory && this.store && this.store.id) {
			this.loadHistory(this.store.id.toString());
		} else {
			this.isLoadingHistory = false;
			this.cdr.markForCheck();
			if (!this.store) {
				console.warn('Магазин не загружен, история не может быть запрошена');
				this.errorMessage = 'Магазин не выбран';
			}
		}
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
}