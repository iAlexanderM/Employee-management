import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of, forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';

import { PassService } from '../../services/pass.service';
import { TransactionService } from '../../services/transaction.service';
import { SearchFilterResetService } from '../../services/search-filter-reset.service';
import { PassByStoreResponseDto, ContractorPassesDto, PassDetailsDto } from '../../models/store-pass-search.model';
import { Store } from '../../models/transaction.model';

interface DisplayablePassByStoreResponseDto extends PassByStoreResponseDto {
	_activeContractorsList?: ContractorPassesDto[];
	_closedContractorsList?: ContractorPassesDto[];
}

interface ContractorItem {
	result: DisplayablePassByStoreResponseDto;
	resultIndex: number;
	contractor: ContractorPassesDto;
	contractorIndex: number;
	status: 'active' | 'closed';
}

@Component({
	selector: 'app-store-pass-search',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatAutocompleteModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatTableModule,
		MatExpansionModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatTooltipModule,
	],
	templateUrl: './store-pass-search.component.html',
	styleUrls: ['./store-pass-search.component.css'],
	providers: [DatePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('expandCollapse', [
			state('open', style({ height: '*', opacity: 1 })),
			state('closed', style({ height: '0px', opacity: 0 })),
			transition('open <=> closed', animate('300ms ease-in-out')),
		]),
	],
})
export class StorePassSearchComponent implements OnInit, OnDestroy, AfterViewInit {
	searchForm: FormGroup;
	results: DisplayablePassByStoreResponseDto[] = [];
	activeDataSource = new MatTableDataSource<ContractorItem>([]);
	closedDataSource = new MatTableDataSource<ContractorItem>([]);
	displayedColumns: string[] = [
		'store',
		'status',
		'id',
		'scan',
		'name',
		'position',
		'phone',
		'citizenship',
		'productType',
		'startDate',
		'endDate',
		'actions',
	];
	passColumnsActive: string[] = [
		'color',
		'type',
		'duration',
		'cost',
		'transactionDate',
		'startDate',
		'endDate',
		'location',
		'position',
		'passActions',
	];
	passColumnsClosed: string[] = [
		'color',
		'type',
		'duration',
		'cost',
		'transactionDate',
		'startDate',
		'endDate',
		'location',
		'position',
		'closeReason',
	];

	activePanelKey: string | null = null;
	closedPanelKey: string | null = null;

	isLoading = false;
	errorMessage: string | null = null;
	showAddTransactionButton = false;
	private readonly apiBaseUrl = 'http://localhost:8080';
	private pageSize = 100;
	private bufferSize = 300;
	private currentPage = 0;
	private allContractors: ContractorItem[] = [];
	private hasMoreData = true;
	private hasPreviousData = false;

	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);

	private resetSubscription: Subscription | undefined;
	private subscriptions: Subscription[] = [];
	private destroy$ = new Subject<void>();
	private confirmedFields: { [key: string]: string | null } = {
		Building: null,
		Floor: null,
		Line: null,
		StoreNumber: null,
	};
	private activePanelStates: { [key: string]: boolean } = {};
	private closedPanelStates: { [key: string]: boolean } = {};

	@ViewChild('tableTop') tableTop!: ElementRef;
	@ViewChild('tableBottom') tableBottom!: ElementRef;
	@ViewChild('tableContainer') tableContainer!: ElementRef;

	constructor(
		private fb: FormBuilder,
		private passService: PassService,
		private transactionService: TransactionService,
		private router: Router,
		private searchFilterResetService: SearchFilterResetService,
		private cdr: ChangeDetectorRef,
		private datePipe: DatePipe
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
			.subscribe(needsReset => {
				if (needsReset) {
					this.resetFilters();
					this.searchFilterResetService.consumeReset();
				}
			});
		this.loadStoredSearchCriteria();
		this.initializeAutocompleteHandlers();
	}

	ngAfterViewInit(): void {
		this.setupIntersectionObservers();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		this.subscriptions.forEach(sub => sub.unsubscribe());
		this.resetSubscription?.unsubscribe();
	}

	private setupIntersectionObservers(): void {
		const options = { threshold: 0.1 };

		const bottomObserver = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && !this.isLoading && this.hasMoreData) {
				this.loadNextPage();
			}
		}, options);
		bottomObserver.observe(this.tableBottom.nativeElement);

		const topObserver = new IntersectionObserver(entries => {
			if (entries[0].isIntersecting && !this.isLoading && this.hasPreviousData) {
				this.loadPreviousPage();
			}
		}, options);
		topObserver.observe(this.tableTop.nativeElement);
	}

	private loadNextPage(): void {
		this.isLoading = true;
		const previousScrollHeight = this.tableContainer.nativeElement.scrollHeight;
		const previousScrollTop = this.tableContainer.nativeElement.scrollTop;

		this.currentPage++;
		const start = Math.max(0, this.currentPage * this.pageSize - this.pageSize);
		const end = start + this.bufferSize;
		const nextBatch = this.allContractors.slice(start, end);

		if (nextBatch.length < this.pageSize) {
			this.hasMoreData = false;
		}
		this.hasPreviousData = this.currentPage > 0;

		const validBatch = nextBatch.filter(
			item =>
				item.resultIndex !== undefined &&
				item.contractorIndex !== undefined &&
				item.status &&
				item.contractor.contractorId
		);

		this.activeDataSource.data = validBatch.filter(item => item.status === 'active');
		this.closedDataSource.data = validBatch.filter(item => item.status === 'closed');

		setTimeout(() => {
			const container = this.tableContainer.nativeElement;
			const newScrollHeight = container.scrollHeight;
			container.scrollTop = previousScrollTop + (newScrollHeight - previousScrollHeight);
			this.isLoading = false;
			this.cdr.markForCheck();
		}, 0);
	}

	private loadPreviousPage(): void {
		if (this.currentPage <= 0) return;
		this.isLoading = true;
		const previousScrollHeight = this.tableContainer.nativeElement.scrollHeight;
		const previousScrollTop = this.tableContainer.nativeElement.scrollTop;

		this.currentPage--;
		const start = Math.max(0, this.currentPage * this.pageSize);
		const end = start + this.bufferSize;
		const previousBatch = this.allContractors.slice(start, end);

		this.hasMoreData = true;
		this.hasPreviousData = this.currentPage > 0;

		const validBatch = previousBatch.filter(
			item =>
				item.resultIndex !== undefined &&
				item.contractorIndex !== undefined &&
				item.status &&
				item.contractor.contractorId
		);

		this.activeDataSource.data = validBatch.filter(item => item.status === 'active');
		this.closedDataSource.data = validBatch.filter(item => item.status === 'closed');

		setTimeout(() => {
			const container = this.tableContainer.nativeElement;
			const newScrollHeight = container.scrollHeight;
			container.scrollTop = previousScrollTop - (previousScrollHeight - newScrollHeight);
			this.isLoading = false;
			this.cdr.markForCheck();
		}, 0);
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
				if (this.areAllSearchFieldsConfirmed()) {
					this.searchPasses();
				} else {
					localStorage.removeItem('storeSearchCriteria');
				}
			} catch (e) {
				console.error('Error parsing stored criteria:', e);
				localStorage.removeItem('storeSearchCriteria');
			}
		}
	}

	private saveSearchCriteria(): void {
		if (this.areAllSearchFieldsConfirmed() && (!this.errorMessage || this.errorMessage.includes('не найден(ы)'))) {
			const criteria = this.prepareSearchCriteria();
			localStorage.setItem('storeSearchCriteria', JSON.stringify(criteria));
		} else {
			localStorage.removeItem('storeSearchCriteria');
		}
	}

	private prepareSearchCriteria(): any {
		return {
			building: this.confirmedFields['Building'] ?? '',
			floor: this.confirmedFields['Floor'] ?? '',
			line: this.confirmedFields['Line'] ?? '',
			storeNumber: this.confirmedFields['StoreNumber'] ?? '',
			showActive: true,
			showClosed: true,
		};
	}

	private getActiveContractorsInternal(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return result.contractors?.filter(c => c.activePasses && c.activePasses.length > 0) || [];
	}

	private getClosedContractorsInternal(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return result.contractors?.filter(c => (!c.activePasses || c.activePasses.length === 0) && c.closedPasses && c.closedPasses.length > 0) || [];
	}

	searchPasses(): void {
		this.errorMessage = null;
		this.showAddTransactionButton = false;
		this.results = [];
		this.activeDataSource.data = [];
		this.closedDataSource.data = [];
		this.allContractors = [];
		this.currentPage = 0;
		this.hasMoreData = true;
		this.hasPreviousData = false;
		this.activePanelStates = {};
		this.closedPanelStates = {};

		const allFilledFieldsConfirmed = Object.keys(this.confirmedFields).every(key => {
			const controlValue = this.searchForm.get(key)?.value;
			return !controlValue || this.isFieldConfirmed(key);
		});
		if (!allFilledFieldsConfirmed) {
			this.errorMessage = 'Выберите значения для всех заполненных полей из списка автодополнения.';
			this.isLoading = false;
			this.cdr.markForCheck();
			return;
		}
		if (!this.areAllSearchFieldsConfirmed()) {
			this.errorMessage = 'Все поля (Здание, Этаж, Линия, Торговая точка) должны быть заполнены и подтверждены для поиска.';
			this.isLoading = false;
			this.cdr.markForCheck();
			return;
		}

		this.isLoading = true;
		this.cdr.markForCheck();
		const criteria = this.prepareSearchCriteria();

		this.passService
			.searchPassesByStore(criteria)
			.pipe(
				takeUntil(this.destroy$),
				catchError(error => {
					console.error('Search error:', error);
					this.errorMessage = error.error?.message || error.message || 'Ошибка при выполнении поиска.';
					if (error.status === 404) {
						this.errorMessage = `Торговая точка ${criteria.building}-${criteria.floor}-${criteria.line}-${criteria.storeNumber} не найдена.`;
					}
					this.results = [];
					this.activeDataSource.data = [];
					this.closedDataSource.data = [];
					this.isLoading = false;
					this.activePanelStates = {};
					this.closedPanelStates = {};
					this.saveSearchCriteria();
					this.cdr.markForCheck();
					return of([]);
				})
			)
			.subscribe({
				next: (response: PassByStoreResponseDto[]) => {
					console.log('API response:', response); // Отладка
					const processedResults: DisplayablePassByStoreResponseDto[] = response.map(result => {
						const processedContractors = (result.contractors || []).map(contractor => ({
							...contractor,
							activePasses: this.getSortedPasses(contractor.activePasses || [], result),
							closedPasses: this.getSortedPasses(contractor.closedPasses || [], result),
							allActivePasses: this.getSortedPasses(contractor.allActivePasses || [], result),
						}));
						const processedResult: PassByStoreResponseDto = { ...result, contractors: processedContractors };
						const activeList = this.getActiveContractorsInternal(processedResult);
						const closedList = this.getClosedContractorsInternal(processedResult);
						return { ...processedResult, _activeContractorsList: activeList, _closedContractorsList: closedList };
					});
					this.results = processedResults;

					const flattenedContractors: ContractorItem[] = [];
					processedResults.forEach((result, resultIndex) => {
						result._activeContractorsList?.forEach((contractor, contractorIndex) => {
							if (contractor?.contractorId && contractor.activePasses?.length) {
								flattenedContractors.push({
									result,
									resultIndex,
									contractor,
									contractorIndex,
									status: 'active',
								});
							}
						});
						result._closedContractorsList?.forEach((contractor, contractorIndex) => {
							if (contractor?.contractorId && contractor.closedPasses?.length) {
								flattenedContractors.push({
									result,
									resultIndex,
									contractor,
									contractorIndex,
									status: 'closed',
								});
							}
						});
					});

					this.allContractors = flattenedContractors;
					console.log('allContractors:', this.allContractors); // Отладка

					const firstBatch = this.allContractors.slice(0, this.bufferSize);
					this.activeDataSource.data = firstBatch.filter(item => item.status === 'active');
					this.closedDataSource.data = firstBatch.filter(item => item.status === 'closed');
					this.hasMoreData = this.allContractors.length > this.bufferSize;
					this.hasPreviousData = false;

					if (this.results.length > 0) {
						const firstResult = this.results[0];
						if ((firstResult._activeContractorsList?.length ?? 0) === 0 && (firstResult._closedContractorsList?.length ?? 0) === 0) {
							this.errorMessage = 'Торговая точка найдена, но связанных пропусков не существует.';
							this.showAddTransactionButton = true;
						} else {
							this.errorMessage = null;
							this.showAddTransactionButton = true;
						}
					} else if (!this.errorMessage) {
						this.errorMessage = 'Поиск не вернул результатов.';
					}

					this.isLoading = false;
					this.cdr.markForCheck();
				},
			});
	}

	resetFilters(): void {
		this.searchForm.reset({ Building: '', Floor: '', Line: '', StoreNumber: '' });
		this.confirmedFields = { Building: null, Floor: null, Line: null, StoreNumber: null };
		localStorage.removeItem('storeSearchCriteria');
		this.results = [];
		this.activeDataSource.data = [];
		this.closedDataSource.data = [];
		this.allContractors = [];
		this.currentPage = 0;
		this.hasMoreData = true;
		this.hasPreviousData = false;
		this.errorMessage = null;
		this.showAddTransactionButton = false;
		this.buildingSuggestions$.next([]);
		this.floorSuggestions$.next([]);
		this.lineSuggestions$.next([]);
		this.storeNumberSuggestions$.next([]);
		this.activePanelStates = {};
		this.closedPanelStates = {};
		this.cdr.markForCheck();
	}

	initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', this.passService.getBuildingSuggestions.bind(this.passService));
		this.setupAutocomplete('Floor', this.passService.getFloorSuggestions.bind(this.passService));
		this.setupAutocomplete('Line', this.passService.getLineSuggestions.bind(this.passService));
		this.setupAutocomplete('StoreNumber', this.passService.getStoreNumberSuggestions.bind(this.passService));
	}

	private setupAutocomplete(controlName: string, suggestionServiceMethod: (query: string) => Observable<string[]>): void {
		const control = this.searchForm.get(controlName);
		if (control) {
			const subscription = control.valueChanges
				.pipe(
					takeUntil(this.destroy$),
					debounceTime(300),
					distinctUntilChanged(),
					switchMap(query => {
						const trimmedQuery = query?.trim() ?? '';
						if (this.confirmedFields[controlName] === trimmedQuery && trimmedQuery) {
							this.getSuggestionSubject(controlName).next([]);
							return of([]);
						}
						if (this.confirmedFields[controlName] !== trimmedQuery) {
							this.confirmedFields[controlName] = null;
						}
						if (!trimmedQuery) {
							this.confirmedFields[controlName] = null;
							this.getSuggestionSubject(controlName).next([]);
							return of([]);
						}
						return suggestionServiceMethod(trimmedQuery).pipe(catchError(() => of([])));
					})
				)
				.subscribe(suggestions => {
					this.getSuggestionSubject(controlName).next(suggestions);
					this.cdr.markForCheck();
				});
			this.subscriptions.push(subscription);
		}
	}

	onInput(controlName: string, event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		if (this.confirmedFields[controlName] !== null && this.confirmedFields[controlName] !== value) {
			this.confirmedFields[controlName] = null;
			this.cdr.markForCheck();
		}
	}

	selectSuggestion(controlName: string, event: MatAutocompleteSelectedEvent): void {
		const value = event.option.value;
		this.searchForm.get(controlName)?.setValue(value, { emitEvent: false });
		this.confirmedFields[controlName] = value;
		this.getSuggestionSubject(controlName).next([]);
		this.cdr.markForCheck();
	}

	isFieldConfirmed(controlName: string): boolean {
		const controlValue = this.searchForm.get(controlName)?.value;
		return !!controlValue && this.confirmedFields[controlName] === controlValue;
	}

	areAllSearchFieldsConfirmed(): boolean {
		return this.isFieldConfirmed('Building') && this.isFieldConfirmed('Floor') && this.isFieldConfirmed('Line') && this.isFieldConfirmed('StoreNumber');
	}

	private getSuggestionSubject(controlName: string): BehaviorSubject<string[]> {
		switch (controlName) {
			case 'Building':
				return this.buildingSuggestions$;
			case 'Floor':
				return this.floorSuggestions$;
			case 'Line':
				return this.lineSuggestions$;
			case 'StoreNumber':
				return this.storeNumberSuggestions$;
			default:
				return new BehaviorSubject<string[]>([]);
		}
	}

	formatStore(store: PassByStoreResponseDto): string {
		return `${store.building} ${store.floor} ${store.line} ${store.storeNumber}`.trim();
	}

	getFirstPhotoUrl(contractor: ContractorPassesDto): string {
		if (!contractor.contractorPhotoPath) return '/assets/images/default-photo.jpg';
		const filePath = contractor.contractorPhotoPath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return filePath ? `${this.apiBaseUrl}/${filePath}` : '/assets/images/default-photo.jpg';
	}

	getLastDocumentPhotoUrl(contractor: ContractorPassesDto): string {
		if (!contractor.documentPhotos) return '/assets/images/default-doc.png';
		const photos = contractor.documentPhotos.split(',').map(p => p.trim()).filter(p => !!p);
		const lastPhotoPath = photos.length > 0 ? photos[photos.length - 1] : null;
		if (!lastPhotoPath) return '/assets/images/default-doc.png';
		const filePath = lastPhotoPath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return filePath ? `${this.apiBaseUrl}/${filePath}` : '/assets/images/default-doc.png';
	}

	getLatestPass(passes: PassDetailsDto[] | undefined): PassDetailsDto | undefined {
		if (!passes || passes.length === 0) return undefined;
		return [...passes].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
	}

	getSortedPasses(passes: PassDetailsDto[], currentStore?: PassByStoreResponseDto): PassDetailsDto[] {
		if (!passes || passes.length === 0) return [];
		return [...passes].sort((a, b) => {
			if (currentStore) {
				const aMatches = a.building === currentStore.building && a.floor === currentStore.floor && a.line === currentStore.line && a.storeNumber === currentStore.storeNumber;
				const bMatches = b.building === currentStore.building && b.floor === currentStore.floor && b.line === currentStore.line && b.storeNumber === currentStore.storeNumber;
				if (aMatches && !bMatches) return -1;
				if (!aMatches && bMatches) return 1;
			}
			return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
		});
	}

	getPassDataSource(item: ContractorItem): MatTableDataSource<PassDetailsDto> {
		const passes = item.status === 'active' ? item.contractor.activePasses || [] : item.contractor.closedPasses || [];
		return new MatTableDataSource<PassDetailsDto>(passes);
	}

	viewContractor(contractorId: number): void {
		const url = this.router.serializeUrl(this.router.createUrlTree(['/contractors/details', contractorId]));
		window.open(url, '_blank');
	}

	editContractor(contractorId: number): void {
		const url = this.router.serializeUrl(this.router.createUrlTree(['/contractors/edit', contractorId]));
		window.open(url, '_blank');
	}

	goToCreateTransactionFromSearch(): void {
		if (!this.areAllSearchFieldsConfirmed()) {
			this.errorMessage = 'Все поля должны быть заполнены и подтверждены.';
			this.cdr.markForCheck();
			return;
		}
		this.isLoading = true;
		this.errorMessage = null;
		this.cdr.markForCheck();
		const building = this.confirmedFields['Building']!;
		const floor = this.confirmedFields['Floor']!;
		const line = this.confirmedFields['Line']!;
		const storeNumber = this.confirmedFields['StoreNumber']!;
		this.transactionService
			.getStoreByDetails(building, floor, line, storeNumber)
			.pipe(
				takeUntil(this.destroy$),
				catchError(err => {
					console.error('getStoreByDetails error:', err);
					this.errorMessage =
						err.status === 404
							? `Торговая точка ${building}-${floor}-${line}-${storeNumber} не найдена.`
							: `Ошибка получения данных торговой точки: ${err.message || 'Ошибка'}`;
					this.isLoading = false;
					this.cdr.markForCheck();
					return of(null);
				})
			)
			.subscribe({
				next: (store: Store | null) => {
					this.isLoading = false;
					if (!store) {
						if (!this.errorMessage) this.errorMessage = 'Торговая точка не найдена.';
						this.cdr.markForCheck();
						return;
					}
					this.router.navigate(['/transactions/create'], { state: { store } });
					this.cdr.markForCheck();
				},
			});
	}

	extendPass(pass: PassDetailsDto, result: DisplayablePassByStoreResponseDto): void {
		let newStartDate: Date;
		try {
			const previousEndDate = new Date(pass.endDate);
			if (isNaN(previousEndDate.getTime())) throw new Error(`Invalid date: ${pass.endDate}`);
			newStartDate = new Date(previousEndDate);
			newStartDate.setDate(newStartDate.getDate() + 1);
		} catch (error: any) {
			console.error('Date parse error:', error);
			this.errorMessage = `Ошибка даты: ${error.message}`;
			this.cdr.markForCheck();
			return;
		}
		this.isLoading = true;
		this.errorMessage = null;
		this.cdr.markForCheck();
		forkJoin({
			contractor: this.transactionService.getContractorById(pass.contractorId),
			store: this.transactionService.getStoreByDetails(pass.building, pass.floor, pass.line, pass.storeNumber),
			passType: this.transactionService.getPassTypeById(pass.passTypeId),
		})
			.pipe(
				takeUntil(this.destroy$),
				catchError(err => {
					console.error('Extend forkJoin error:', err);
					this.errorMessage = `Ошибка продления: ${err?.error?.message || err?.message || 'Ошибка сервера'}`;
					this.isLoading = false;
					this.cdr.markForCheck();
					return of(null);
				})
			)
			.subscribe({
				next: (data) => {
					if (!data || !data.contractor || !data.store || !data.passType) {
						this.isLoading = false;
						if (!this.errorMessage) this.errorMessage = 'Неполные данные для продления.';
						console.error('Incomplete extend data:', data);
						this.cdr.markForCheck();
						return;
					}
					const { contractor, store, passType } = data;
					const formattedStartDate = this.datePipe.transform(newStartDate, 'yyyy-MM-dd');
					const extendData = {
						contractorId: contractor.id,
						passTypeId: passType.id,
						store,
						startDate: formattedStartDate,
						position: pass.position || 'Employee',
						contractorDetails: {
							id: contractor.id,
							lastName: contractor.lastName || '',
							firstName: contractor.firstName || '',
							middleName: contractor.middleName || '',
							passportSerialNumber: contractor.passportSerialNumber || '',
						},
						passType: {
							id: passType.id,
							name: passType.name,
							durationInMonths: passType.durationInMonths,
							cost: passType.cost,
						},
					};
					this.isLoading = false;
					this.cdr.markForCheck();
					this.router.navigate(['/transactions/create'], { state: extendData });
				},
			});
	}

	closePass(passId: number, contractorIndex: number, resultIndex: number): void {
		const closeReason = prompt('Причина закрытия:');
		if (closeReason === null) return;
		if (closeReason.trim() === '') {
			alert('Причина не может быть пустой.');
			return;
		}
		this.isLoading = true;
		this.errorMessage = null;
		this.cdr.markForCheck();
		this.passService
			.closePass(passId, closeReason.trim())
			.pipe(
				takeUntil(this.destroy$),
				catchError(err => {
					console.error('Close pass error:', err);
					let msg = 'Ошибка закрытия пропуска.';
					if (err.error && typeof err.error === 'string') msg = `Ошибка: ${err.error}`;
					else if (err.error?.message) msg = `Ошибка: ${err.error.message}`;
					else if (err.message) msg = `Ошибка: ${err.message}`;
					this.errorMessage = msg;
					this.isLoading = false;
					this.cdr.markForCheck();
					return of(null);
				})
			)
			.subscribe({
				next: (response) => {
					if (response !== null || !this.errorMessage) {
						this.isLoading = false;
						this.searchPasses();
					}
				},
			});
	}

	toggleActivePanel(resultIndex: number, contractorIndex: number): void {
		const key = `active-${resultIndex}-${contractorIndex}`;
		this.activePanelKey = this.activePanelKey === key ? null : key;
		this.cdr.detectChanges();
	}

	isActivePanelExpanded(resultIndex: number, contractorIndex: number): boolean {
		return this.activePanelKey === `active-${resultIndex}-${contractorIndex}`;
	}

	isActivePanelExpandedWhen = (_index: number, item: ContractorItem): boolean => {
		return this.isActivePanelExpanded(item.resultIndex, item.contractorIndex);
	};

	toggleClosedPanel(resultIndex: number, contractorIndex: number): void {
		const key = `closed-${resultIndex}-${contractorIndex}`;
		this.closedPanelKey = this.closedPanelKey === key ? null : key;
		this.cdr.detectChanges();
	}

	isClosedPanelExpanded(resultIndex: number, contractorIndex: number): boolean {
		return this.closedPanelKey === `closed-${resultIndex}-${contractorIndex}`;
	}

	isClosedPanelExpandedWhen = (_index: number, item: ContractorItem): boolean => {
		return this.isClosedPanelExpanded(item.resultIndex, item.contractorIndex);
	};

	isActiveDetailRow = (index: number, row: any) => row.isDetailRow && this.isActivePanelExpanded(row.resultIndex, row.contractorIndex);

	openImageInNewWindow(url: string | null): void {
		if (url && !url.includes('default-photo.jpg') && !url.includes('default-doc.png')) {
			window.open(url, '_blank');
		}
	}

	trackByResult(_index: number, data: DisplayablePassByStoreResponseDto): string {
		return `${data.building}-${data.floor}-${data.line}-${data.storeNumber}`;
	}

	trackByContractor(_index: number, data: ContractorPassesDto): number {
		return data.contractorId;
	}
}