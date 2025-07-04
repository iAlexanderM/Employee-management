import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of, Subject, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { PassService } from '../../services/pass.service';
import { TransactionService } from '../../services/transaction.service';
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
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { trigger, transition, style, animate } from '@angular/animations';

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
		MatCardModule,
		MatDividerModule,
		InfiniteScrollModule
	],
	templateUrl: './store-pass-search.component.html',
	styleUrls: ['./store-pass-search.component.css'],
	animations: [
		trigger('fadeIn', [
			transition(':enter', [
				style({ opacity: 0, transform: 'translateY(20px)' }),
				animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
			])
		])
	]
})
export class StorePassSearchComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChild('loadPreviousTrigger') loadPreviousTrigger!: ElementRef;

	private readonly PAGE_SIZE = 100;
	private readonly MAX_BUFFER_SIZE = 300; // Ограничение DOM для управления памятью
	private readonly DEBOUNCE_TIME_MS = 300;
	private readonly INTERSECTION_THRESHOLD = 0.1;
	private readonly ROOT_MARGIN = '1000px';
	private readonly API_BASE_URL = 'http://localhost:8080';
	private readonly DEFAULT_PHOTO_URL = '/assets/images/default-photo.jpg';

	searchForm: FormGroup;
	flattenedContractors: { store: PassByStoreResponseDto; contractor: ContractorPassesDto; isActive: boolean }[] = [];
	isLoading = false;
	errorMessage: string | null = null;
	page = 1;
	firstIndex = 0; // Индекс первого элемента в flattenedContractors
	totalCount = 0;
	hasMoreResults = true;
	hasPreviousResults = false;
	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);
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

	constructor(
		private fb: FormBuilder,
		private passService: PassService,
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
			{ threshold: this.INTERSECTION_THRESHOLD, rootMargin: this.ROOT_MARGIN }
		);
	}

	ngOnInit(): void {
		this.loadStoredSearchCriteria();
		this.initializeAutocompleteHandlers();
		this.initializeFormSubscriptions();
		this.initializeScrollDebounce();
		this.initializeResetSubscription();
	}

	ngAfterViewInit(): void {
		if (this.loadPreviousTrigger?.nativeElement) {
			console.debug('Observing loadPreviousTrigger');
			this.intersectionObserver.observe(this.loadPreviousTrigger.nativeElement);
		} else {
			setTimeout(() => this.observePreviousTrigger(), 100);
		}
		this.restoreScrollPosition();
		this.cdr.markForCheck();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
		this.intersectionObserver.disconnect();
		this.destroy$.next();
		this.destroy$.complete();
	}

	private observePreviousTrigger(): void {
		if (this.loadPreviousTrigger?.nativeElement) {
			console.debug('Observing loadPreviousTrigger');
			this.intersectionObserver.observe(this.loadPreviousTrigger.nativeElement);
		} else {
			setTimeout(() => this.observePreviousTrigger(), 100);
		}
	}

	private handleIntersection(entries: IntersectionObserverEntry[]): void {
		entries.forEach(entry => {
			if (entry.isIntersecting && !this.isLoading && this.hasPreviousResults) {
				console.debug('IntersectionObserver triggered: Loading previous results');
				this.scrollSubject.next();
			}
		});
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

	private initializeScrollDebounce(): void {
		this.subscriptions.push(
			this.scrollSubject.pipe(
				debounceTime(this.DEBOUNCE_TIME_MS),
				takeUntil(this.destroy$)
			).subscribe(() => {
				if (!this.isLoading && this.hasPreviousResults) {
					this.loadPreviousResults();
				}
			})
		);
	}

	private initializeFormSubscriptions(): void {
		this.subscriptions.push(
			this.searchForm.valueChanges.pipe(
				debounceTime(this.DEBOUNCE_TIME_MS),
				distinctUntilChanged(),
				takeUntil(this.destroy$)
			).subscribe(() => {
				if (this.areAllFieldsConfirmed()) {
					this.searchPasses(true);
				}
			})
		);
	}

	private loadStoredSearchCriteria(): void {
		const storedCriteria = localStorage.getItem('storeSearchCriteria');
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
			if (this.areAllFieldsConfirmed()) {
				this.searchPasses(true);
			}
		}
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
		localStorage.setItem('storeSearchCriteria', JSON.stringify(criteria));
	}

	private flattenResults(results: PassByStoreResponseDto[], showActive: boolean, showClosed: boolean): { store: PassByStoreResponseDto; contractor: ContractorPassesDto; isActive: boolean }[] {
		const flattened: { store: PassByStoreResponseDto; contractor: ContractorPassesDto; isActive: boolean }[] = [];
		const contractorIds = new Set<number>();

		results.forEach(store => {
			const contractors = store.contractors ?? [];
			contractors.forEach(contractor => {
				if (!contractor.contractorId) return;
				const activePassesForStore = (contractor.activePasses ?? []).filter(
					pass => pass.building === store.building &&
						pass.floor === store.floor &&
						pass.line === store.line &&
						pass.storeNumber === store.storeNumber
				);
				const closedPassesForStore = (contractor.closedPasses ?? []).filter(
					pass => pass.building === store.building &&
						pass.floor === store.floor &&
						pass.line === store.line &&
						pass.storeNumber === store.storeNumber
				);

				const hasActivePassesForStore = activePassesForStore.length > 0;
				const hasClosedPassesForStore = closedPassesForStore.length > 0;

				if (showActive && hasActivePassesForStore && !contractorIds.has(contractor.contractorId)) {
					flattened.push({ store, contractor, isActive: true });
					contractorIds.add(contractor.contractorId);
				} else if (showClosed && hasClosedPassesForStore && !hasActivePassesForStore && !contractorIds.has(contractor.contractorId)) {
					flattened.push({ store, contractor, isActive: false });
					contractorIds.add(contractor.contractorId);
				}
			});
		});

		return flattened;
	}

	public areAllFieldsConfirmed(): boolean {
		return Object.values(this.confirmedFields).every(value => value !== null && value.trim() !== '');
	}

	private searchPasses(isInitialSearch: boolean, direction: 'down' | 'up' = 'down'): void {
		if (!this.areAllFieldsConfirmed()) {
			this.errorMessage = 'Выберите значения для всех полей';
			this.flattenedContractors = [];
			this.cdr.markForCheck();
			return;
		}

		if (this.isLoading) return;

		this.isLoading = true;
		this.errorMessage = null;
		const criteria = this.prepareSearchCriteria(isInitialSearch, direction);

		const cacheKey = this.getCacheKey(criteria);
		if (this.pageCache[cacheKey]) {
			this.handleSearchResponse(this.pageCache[cacheKey], isInitialSearch, direction);
			return;
		}

		this.passService.searchPassesByStore(criteria).subscribe({
			next: (response: PassByStoreResponseDto[]) => {
				if (!response || response.every(r => !r.contractors || r.contractors.length === 0)) {
					this.errorMessage = null;
					this.flattenedContractors = [];
					this.totalCount = response[0]?.totalCount || 0;
					this.hasMoreResults = false;
					this.hasPreviousResults = this.firstIndex > 0;
					this.isLoading = false;
					this.cdr.markForCheck();
					return;
				}
				this.pageCache[cacheKey] = response;
				this.handleSearchResponse(response, isInitialSearch, direction);
			},
			error: (error) => {
				console.error('Search error:', error);
				this.errorMessage = 'Ошибка сервера';
				this.isLoading = false;
				this.flattenedContractors = [];
				this.totalCount = -1;
				this.cdr.markForCheck();
			}
		});
	}

	private getCacheKey(criteria: SearchCriteria): string {
		return `${criteria.building}_${criteria.floor}_${criteria.line}_${criteria.storeNumber}_${criteria.showActive}_${criteria.showClosed}_${criteria.page}`;
	}

	private handleSearchResponse(response: PassByStoreResponseDto[], isInitialSearch: boolean, direction: 'down' | 'up'): void {
		const showActive = this.searchForm.get('showActive')?.value ?? true;
		const showClosed = this.searchForm.get('showClosed')?.value ?? false;
		const newFlattened = this.flattenResults(response, showActive, showClosed);

		let scrollPosition = window.scrollY;

		if (isInitialSearch) {
			this.flattenedContractors = newFlattened;
			this.firstIndex = 0;
			this.page = 1;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else if (direction === 'down') {
			const existingIds = new Set(this.flattenedContractors.map(c => c.contractor.contractorId));
			const filteredNewFlattened = newFlattened.filter(c => !existingIds.has(c.contractor.contractorId));
			this.flattenedContractors.push(...filteredNewFlattened);
			if (this.flattenedContractors.length > this.MAX_BUFFER_SIZE) {
				this.flattenedContractors.splice(0, this.flattenedContractors.length - this.MAX_BUFFER_SIZE);
				this.firstIndex += filteredNewFlattened.length;
			}
			this.page++;
		} else {
			const existingIds = new Set(this.flattenedContractors.map(c => c.contractor.contractorId));
			const filteredNewFlattened = newFlattened.filter(c => !existingIds.has(c.contractor.contractorId));
			this.flattenedContractors.unshift(...filteredNewFlattened);
			if (this.flattenedContractors.length > this.MAX_BUFFER_SIZE) {
				this.flattenedContractors.splice(this.MAX_BUFFER_SIZE);
			}
			this.firstIndex = Math.max(0, this.firstIndex - filteredNewFlattened.length);
			this.page--;
			// Сохраняем позицию скролла
			const newHeight = this.loadPreviousTrigger.nativeElement.offsetTop;
			window.scrollTo({ top: scrollPosition + newHeight, behavior: 'auto' });
		}

		this.totalCount = response[0]?.totalCount || 0;
		this.hasMoreResults = this.flattenedContractors.length < this.totalCount && response.length > 0;
		this.hasPreviousResults = this.firstIndex > 0;
		this.isLoading = false;
		console.debug('DOM elements:', this.flattenedContractors.length);
		this.cdr.markForCheck();
	}

	public loadMoreResults(): void {
		this.searchPasses(false, 'down');
	}

	private loadPreviousResults(): void {
		if (this.page > 1) {
			this.searchPasses(false, 'up');
		}
	}

	private prepareSearchCriteria(isInitialSearch: boolean, direction: 'down' | 'up' = 'down'): SearchCriteria {
		const targetPage = isInitialSearch ? 1 : (direction === 'down' ? this.page + 1 : this.page - 1);
		const criteria: SearchCriteria = {
			building: this.confirmedFields['Building'] || '',
			floor: this.confirmedFields['Floor'] || '',
			line: this.confirmedFields['Line'] || '',
			storeNumber: this.confirmedFields['StoreNumber'] || '',
			showActive: this.searchForm.get('showActive')?.value ?? true,
			showClosed: this.searchForm.get('showClosed')?.value ?? false,
			page: targetPage,
			pageSize: this.PAGE_SIZE
		};
		if (isInitialSearch) {
			this.saveSearchCriteria();
		}
		return criteria;
	}

	private restoreScrollPosition(): void {
		const scrollPosition = sessionStorage.getItem('storePassScrollPosition');
		const storedPanelStates = sessionStorage.getItem('storePassPanelStates');
		if (scrollPosition) {
			window.scrollTo({ top: +scrollPosition, behavior: 'smooth' });
			sessionStorage.removeItem('storePassScrollPosition');
		}
		if (storedPanelStates) {
			this.panelStates = new Map(JSON.parse(storedPanelStates));
			sessionStorage.removeItem('storePassPanelStates');
		}
		this.cdr.markForCheck();
	}

	public resetFilters(): void {
		this.searchForm.reset({ showActive: true, showClosed: false });
		this.confirmedFields = { Building: null, Floor: null, Line: null, StoreNumber: null };
		localStorage.removeItem('storeSearchCriteria');
		this.flattenedContractors = [];
		this.errorMessage = null;
		this.page = 1;
		this.firstIndex = 0;
		this.hasMoreResults = true;
		this.hasPreviousResults = false;
		this.pageCache = {};
		this.totalCount = -1;
		this.panelStates.clear();
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
					debounceTime(this.DEBOUNCE_TIME_MS),
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

	public isFieldConfirmed(controlName: string): boolean {
		const currentValue = this.searchForm.get(controlName)?.value?.trim() || '';
		return this.confirmedFields[controlName] === currentValue && currentValue !== '';
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

	public getAbsolutePhotoUrl(relativePath: string | null): string | null {
		if (!relativePath) {
			return this.DEFAULT_PHOTO_URL;
		}
		const cleanedPath = relativePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return `${this.API_BASE_URL}/${cleanedPath}`;
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
			passes = (contractor.activePasses ?? []).filter(
				pass => pass.building === store.building &&
					pass.floor === store.floor &&
					pass.line === store.line &&
					pass.storeNumber === store.storeNumber
			);
		} else if (showClosed) {
			const closedPassesForStore = (contractor.closedPasses ?? []).filter(
				pass => pass.building === store.building &&
					pass.floor === store.floor &&
					pass.line === store.line &&
					pass.storeNumber === store.storeNumber
			);
			passes = [
				...(contractor.activePasses ?? []).filter(
					pass => pass.building === store.building &&
						pass.floor === store.floor &&
						pass.line === store.line &&
						pass.storeNumber === store.storeNumber
				),
				...closedPassesForStore
			];
		}

		return passes.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
	}

	public viewContractor(contractorId: number): void {
		sessionStorage.setItem('storePassScrollPosition', window.scrollY.toString());
		sessionStorage.setItem('storePassPanelStates', JSON.stringify(Array.from(this.panelStates.entries())));
		this.router.navigate(['/contractors/details', contractorId]);
	}

	public editContractor(contractorId: number): void {
		sessionStorage.setItem('storePassScrollPosition', window.scrollY.toString());
		sessionStorage.setItem('storePassPanelStates', JSON.stringify(Array.from(this.panelStates.entries())));
		this.router.navigate(['/contractors/edit', contractorId]);
	}

	public extendPass(pass: PassDetailsDto, store: PassByStoreResponseDto): void {
		let newStartDate: Date;
		try {
			const previousEndDate = new Date(pass.endDate);
			if (isNaN(previousEndDate.getTime())) {
				throw new Error(`Invalid pass end date format: ${pass.endDate}`);
			}
			newStartDate = new Date(previousEndDate);
			newStartDate.setDate(newStartDate.getDate() + 1);
		} catch (error) {
			console.error("Ошибка парсинга даты окончания пропуска:", error);
			this.errorMessage = "Неверный формат даты окончания предыдущего пропуска.";
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
					console.error("Не удалось получить полные данные для продления:", { contractor, store, passType });
					this.errorMessage = "Не удалось получить все данные (контрагент, магазин или тип пропуска) для продления.";
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
					position: pass.position || 'Наёмный работник',
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

				this.isLoading = false;
				this.router.navigate(['/transactions/create'], { state: extendData });
			},
			error: (err) => {
				console.error('Ошибка при загрузке данных для продления:', err);
				this.errorMessage = `Ошибка при загрузке данных для продления: ${err.error?.message || 'Неизвестная ошибка'}`;
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
			this.errorMessage = `Пропуск с ID ${passId} не найден.`;
			this.cdr.markForCheck();
			return;
		}
		if (pass.isClosed) {
			this.errorMessage = `Пропуск с ID ${passId} уже закрыт.`;
			this.cdr.markForCheck();
			return;
		}

		const reason = prompt('Укажите причину закрытия пропуска:');
		if (!reason) {
			this.errorMessage = 'Причина закрытия не указана.';
			this.cdr.markForCheck();
			return;
		}

		const user = this.userService.getCurrentUser();
		const closedBy = user?.id;
		if (!closedBy || !user?.userName) {
			this.errorMessage = 'Не удалось определить пользователя. Пожалуйста, войдите снова.';
			this.cdr.markForCheck();
			return;
		}

		this.isLoading = true;
		this.passService.closePass(passId, reason, closedBy).subscribe({
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
				this.errorMessage = 'Не удалось закрыть пропуск: ' + (err.error?.message || 'Неизвестная ошибка');
				this.isLoading = false;
				this.cdr.markForCheck();
			}
		});
	}

	public addPass(): void {
		if (!this.areAllFieldsConfirmed()) {
			this.errorMessage = 'Выберите значения для всех полей';
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
					this.errorMessage = 'Не удалось найти магазин для создания пропуска.';
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
				this.errorMessage = `Ошибка при загрузке данных магазина: ${err.error?.message || 'Неизвестная ошибка'}`;
				this.isLoading = false;
				this.cdr.markForCheck();
			}
		});
	}

	public togglePanel(contractorId: number, type: 'active' | 'closed'): void {
		const key = `${contractorId}-${type}`;
		const currentState = this.panelStates.get(key) || false;
		this.panelStates.set(key, !currentState);
		this.cdr.detectChanges(); // Явное обновление DOM для mat-expansion-panel
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
}