import { Component, OnInit, OnDestroy, ViewChildren, QueryList, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of, forkJoin, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { PassService } from '../../services/pass.service';
import { QueueSyncService } from '../../services/queue-sync.service';
import { TransactionService } from '../../services/transaction.service';
import { SearchFilterResetService } from '../../services/search-filter-reset.service';
import { PassByStoreResponseDto, ContractorPassesDto, PassDetailsDto } from '../../models/store-pass-search.model';
import { Store } from '../../models/transaction.model';

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
		MatExpansionModule,
		MatIconModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MatTooltipModule
	],
	templateUrl: './store-pass-search.component.html',
	styleUrls: ['./store-pass-search.component.css']
})
export class StorePassSearchComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChildren('activePanels') activePanels!: QueryList<MatExpansionPanel>;
	@ViewChildren('closedPanels') closedPanels!: QueryList<MatExpansionPanel>;
	@ViewChildren('closedContractorsPanel') closedContractorsPanels!: QueryList<MatExpansionPanel>;

	searchForm: FormGroup;
	results: PassByStoreResponseDto[] = [];
	isLoading = false;
	errorMessage: string | null = null;
	private readonly apiBaseUrl = 'http://localhost:8080';

	buildingSuggestions$ = new BehaviorSubject<string[]>([]);
	floorSuggestions$ = new BehaviorSubject<string[]>([]);
	lineSuggestions$ = new BehaviorSubject<string[]>([]);
	storeNumberSuggestions$ = new BehaviorSubject<string[]>([]);

	private resetSubscription: Subscription | undefined;
	private subscriptions: Subscription[] = [];
	private destroy$ = new Subject<void>();

	private confirmedFields: { [key: string]: string | null } = {
		Building: null, Floor: null, Line: null, StoreNumber: null
	};
	private allActivePanelStates: { [key: string]: boolean } = {};
	private allClosedPanelStates: { [key: string]: boolean } = {};
	private closedContractorsPanelStates: { [key: string]: boolean } = {};
	showAddTransactionButton = false;

	constructor(
		private fb: FormBuilder,
		private passService: PassService,
		private transactionService: TransactionService,
		private router: Router,
		private queueSyncService: QueueSyncService,
		private searchFilterResetService: SearchFilterResetService,
		private cdr: ChangeDetectorRef
	) {
		this.searchForm = this.fb.group({
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: ['']
		});
	}

	ngOnInit(): void {
		this.resetSubscription = this.searchFilterResetService.resetTrigger$
			.pipe(takeUntil(this.destroy$))
			.subscribe((needsReset) => {
				if (needsReset === true) {
					this.resetFilters();
					this.searchFilterResetService.consumeReset();
				}
			});

		this.loadStoredSearchCriteria();
		this.initializeAutocompleteHandlers();
	}

	ngAfterViewInit(): void { }

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		this.subscriptions.forEach(sub => sub.unsubscribe());
		this.resetSubscription?.unsubscribe();
	}

	private loadStoredSearchCriteria(): void {
		const storedCriteria = localStorage.getItem('storeSearchCriteria');
		if (storedCriteria) {
			try {
				const criteria = JSON.parse(storedCriteria);
				const valueToPatch: any = {};
				if (criteria.building !== undefined) valueToPatch.Building = criteria.building;
				if (criteria.floor !== undefined) valueToPatch.Floor = criteria.floor;
				if (criteria.line !== undefined) valueToPatch.Line = criteria.line;
				if (criteria.storeNumber !== undefined) valueToPatch.StoreNumber = criteria.storeNumber;
				this.searchForm.patchValue(valueToPatch);
				this.confirmedFields = {
					Building: criteria.building || null, Floor: criteria.floor || null,
					Line: criteria.line || null, StoreNumber: criteria.storeNumber || null
				};
				if (Object.values(this.confirmedFields).every(v => v !== null)) {
					this.searchPasses();
				}
			} catch (e) {
				console.error("Ошибка парсинга сохраненных критериев:", e);
				localStorage.removeItem('storeSearchCriteria');
			}
		}
	}

	private saveSearchCriteria(): void {
		const criteria = this.prepareSearchCriteria();
		if (this.areAllSearchFieldsConfirmed()) {
			localStorage.setItem('storeSearchCriteria', JSON.stringify(criteria));
		} else {
			localStorage.removeItem('storeSearchCriteria');
		}
	}

	prepareSearchCriteria(): any {
		return {
			building: this.confirmedFields['Building'] || '',
			floor: this.confirmedFields['Floor'] || '',
			line: this.confirmedFields['Line'] || '',
			storeNumber: this.confirmedFields['StoreNumber'] || '',
			showActive: true,
			showClosed: true
		};
	}

	searchPasses(): void {
		this.errorMessage = null;
		this.showAddTransactionButton = false;

		const allFilledFieldsConfirmed = Object.keys(this.confirmedFields).every(key => {
			const controlValue = this.searchForm.get(key)?.value;
			return !controlValue || (!!controlValue && this.isFieldConfirmed(key));
		});
		if (!allFilledFieldsConfirmed) {
			this.errorMessage = 'Выберите значения для всех заполненных полей из списка автодополнения.';
			return;
		}

		if (!this.areAllSearchFieldsConfirmed()) {
			this.errorMessage = 'Для поиска необходимо заполнить и подтвердить ВСЕ поля: Здание, Этаж, Линия, Точка.';
			this.results = [];
			return;
		}

		this.isLoading = true;
		const criteria = this.prepareSearchCriteria();

		this.passService.searchPassesByStore(criteria)
			.pipe(
				takeUntil(this.destroy$),
				catchError(error => {
					this.errorMessage = error.error?.message || error.message || 'Ошибка при выполнении поиска.';
					if (error.status === 404) { this.errorMessage = 'Магазин(ы) по заданным критериям не найден(ы).'; }
					console.error('Ошибка поиска:', error);
					this.results = []; this.isLoading = false; this.cdr.detectChanges();
					return of([]);
				})
			)
			.subscribe({
				next: (response: PassByStoreResponseDto[]) => {
					this.results = response.map(result => ({
						...result,
						contractors: result.contractors.map(contractor => ({
							...contractor,
							activePasses: this.getSortedPasses(contractor.activePasses, result),
							closedPasses: this.getSortedPasses(contractor.closedPasses, result),
							allActivePasses: this.getSortedPasses(contractor.allActivePasses, result)
						}))
					}));

					if (this.results.length > 0 && this.results[0].contractors.length === 0) {
						this.errorMessage = 'Пропусков для этой торговой точки пока нет.';
						this.showAddTransactionButton = true;
					} else if (this.results.length === 0 && !this.errorMessage) {
						this.errorMessage = 'Магазин(ы) найден(ы), но нет связанных пропусков.';
					}

					this.isLoading = false;
					this.saveSearchCriteria();
					this.allActivePanelStates = {};
					this.allClosedPanelStates = {};
					this.closedContractorsPanelStates = {};
					this.cdr.detectChanges();
				}
			});
	}

	addTransaction(): void {
		if (this.results.length === 0) {
			return;
		}
		const store = this.results[0];
		this.router.navigate(['/transaction/create'], {
			queryParams: {
				storeId: store.storeId, building: store.building, floor: store.floor,
				line: store.line, storeNumber: store.storeNumber
			}
		});
	}

	resetFilters(): void {
		this.searchForm.reset({ Building: '', Floor: '', Line: '', StoreNumber: '' });
		this.confirmedFields = { Building: null, Floor: null, Line: null, StoreNumber: null };
		localStorage.removeItem('storeSearchCriteria');
		this.results = [];
		this.errorMessage = null;
		this.showAddTransactionButton = false;
		this.buildingSuggestions$.next([]);
		this.floorSuggestions$.next([]);
		this.lineSuggestions$.next([]);
		this.storeNumberSuggestions$.next([]);
		this.allActivePanelStates = {};
		this.allClosedPanelStates = {};
		this.closedContractorsPanelStates = {};
		this.cdr.detectChanges();
	}

	initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', this.passService.getBuildingSuggestions.bind(this.passService));
		this.setupAutocomplete('Floor', this.passService.getFloorSuggestions.bind(this.passService));
		this.setupAutocomplete('Line', this.passService.getLineSuggestions.bind(this.passService));
		this.setupAutocomplete('StoreNumber', this.passService.getStoreNumberSuggestions.bind(this.passService));
	}

	setupAutocomplete(controlName: string, suggestionServiceMethod: (query: string) => Observable<string[]>): void {
		const control = this.searchForm.get(controlName);
		if (control) {
			const subscription = control.valueChanges.pipe(
				takeUntil(this.destroy$),
				distinctUntilChanged(),
				switchMap(query => {
					const trimmedQuery = query?.trim() || '';
					if (this.confirmedFields[controlName] === trimmedQuery && trimmedQuery !== '') return of([]);
					if (this.confirmedFields[controlName] !== trimmedQuery) this.confirmedFields[controlName] = null;
					if (!trimmedQuery) { this.confirmedFields[controlName] = null; return of([]); }
					return suggestionServiceMethod(trimmedQuery).pipe(catchError(() => of([])));
				})
			).subscribe(suggestions => this.getSuggestionSubject(controlName).next(suggestions));
			this.subscriptions.push(subscription);
		}
	}

	onInput(controlName: string, event: Event): void {
		const value = (event.target as HTMLInputElement).value.trim();
		if (this.confirmedFields[controlName] !== value) {
			this.confirmedFields[controlName] = null;
		}
		if (value === '') {
			this.confirmedFields[controlName] = null;
		}
	}

	selectSuggestion(controlName: string, value: string): void {
		this.searchForm.get(controlName)?.setValue(value, { emitEvent: false });
		this.confirmedFields[controlName] = value;
		this.getSuggestionSubject(controlName).next([]);
		this.cdr.detectChanges();
	}

	isFieldConfirmed(controlName: string): boolean {
		const currentValue = this.searchForm.get(controlName)?.value?.trim() || '';
		return !!currentValue && this.confirmedFields[controlName] === currentValue;
	}

	areAllSearchFieldsConfirmed(): boolean {
		return this.isFieldConfirmed('Building') &&
			this.isFieldConfirmed('Floor') &&
			this.isFieldConfirmed('Line') &&
			this.isFieldConfirmed('StoreNumber');
	}

	getSuggestionSubject(controlName: string): BehaviorSubject<string[]> {
		return {
			Building: this.buildingSuggestions$,
			Floor: this.floorSuggestions$,
			Line: this.lineSuggestions$,
			StoreNumber: this.storeNumberSuggestions$
		}[controlName as 'Building' | 'Floor' | 'Line' | 'StoreNumber'] || new BehaviorSubject<string[]>([]);
	}

	formatStore(store: PassByStoreResponseDto): string {
		return `${store.building} ${store.floor} ${store.line} ${store.storeNumber}`.trim();
	}

	getFirstPhotoUrl(pass: ContractorPassesDto): string | null {
		if (!pass.contractorPhotoPath) return '/assets/images/default-photo.jpg';
		const fp = pass.contractorPhotoPath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return `${this.apiBaseUrl}/${fp}`;
	}

	getLastDocumentPhotoUrl(contractor: ContractorPassesDto): string | null {
		if (!contractor.documentPhotos) return '/assets/images/default-doc.png';
		const ps = contractor.documentPhotos.split(',');
		const lp = ps.length > 0 ? ps[ps.length - 1] : null;
		if (!lp) return '/assets/images/default-doc.png';
		const fp = lp.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return `${this.apiBaseUrl}/${fp}`;
	}

	getLatestPass(passes: PassDetailsDto[]): PassDetailsDto | undefined {
		if (!passes || passes.length === 0) return undefined;
		return [...passes].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
	}

	getSortedPasses(passes: PassDetailsDto[], currentStore?: PassByStoreResponseDto): PassDetailsDto[] {
		if (!passes || passes.length === 0) return [];
		return [...passes].sort((a, b) => {
			if (currentStore) {
				const aM = a.building === currentStore.building && a.floor === currentStore.floor && a.line === currentStore.line && a.storeNumber === currentStore.storeNumber;
				const bM = b.building === currentStore.building && b.floor === currentStore.floor && b.line === currentStore.line && b.storeNumber === currentStore.storeNumber;
				if (aM && !bM) return -1;
				if (!aM && bM) return 1;
			}
			return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
		});
	}

	getActiveContractors(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return result.contractors?.filter(c => c.activePasses && c.activePasses.length > 0) || [];
	}

	getClosedContractors(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return result.contractors?.filter(c => (!c.activePasses || c.activePasses.length === 0) && (c.closedPasses && c.closedPasses.length > 0)) || [];
	}

	viewContractor(contractorId: number): void {
		this.router.navigate(['/contractors/details', contractorId]);
	}

	editContractor(contractorId: number): void {
		this.router.navigate(['/contractors/edit', contractorId]);
	}

	goToCreateTransactionFromSearch(): void {
		if (!this.areAllSearchFieldsConfirmed()) {
			this.errorMessage = "Сначала заполните и подтвердите все поля поиска.";
			this.cdr.detectChanges();
			setTimeout(() => { this.errorMessage = null; this.cdr.detectChanges(); }, 4000);
			return;
		}
		this.isLoading = true;
		this.errorMessage = null;
		const building = this.confirmedFields['Building']!;
		const floor = this.confirmedFields['Floor']!;
		const line = this.confirmedFields['Line']!;
		const storeNumber = this.confirmedFields['StoreNumber']!;

		this.transactionService.getStoreByDetails(building, floor, line, storeNumber)
			.pipe(
				takeUntil(this.destroy$),
				catchError(err => {
					console.error("Ошибка getStoreByDetails из поиска:", err);
					this.errorMessage = `Ошибка получения данных магазина: ${err.message || 'Неизвестная ошибка'}`;
					this.isLoading = false; this.cdr.detectChanges();
					return of(null);
				})
			)
			.subscribe({
				next: (fetchedStore: Store | null) => {
					this.isLoading = false;
					if (!fetchedStore) {
						if (!this.errorMessage) this.errorMessage = `Магазин не найден (${building} ${floor} ${line} ${storeNumber}).`;
						this.cdr.detectChanges(); return;
					}
					const navigationState = { store: fetchedStore };
					this.router.navigate(['/transactions/create'], { state: navigationState });
				}
			});
	}

	extendPass(pass: PassDetailsDto, result: PassByStoreResponseDto): void {
		let newStartDate: Date;
		try {
			const previousEndDate = new Date(pass.endDate);
			if (isNaN(previousEndDate.getTime())) throw new Error(`Invalid pass end date format: ${pass.endDate}`);
			newStartDate = new Date(previousEndDate);
			newStartDate.setDate(newStartDate.getDate() + 1);
		} catch (error) {
			console.error("Ошибка парсинга даты:", error);
			this.errorMessage = "Неверный формат даты.";
			return;
		}
		this.isLoading = true;
		this.errorMessage = null;
		forkJoin({
			contractor: this.transactionService.getContractorById(pass.contractorId),
			store: this.transactionService.getStoreByDetails(pass.building, pass.floor, pass.line, pass.storeNumber),
			passType: this.transactionService.getPassTypeById(pass.passTypeId)
		}).pipe(
			takeUntil(this.destroy$),
			catchError(err => {
				console.error('Ошибка forkJoin для продления:', err);
				const msg = err?.error?.message || err?.message || 'Ошибка сервера';
				this.errorMessage = `Ошибка данных продления: ${msg}`;
				this.isLoading = false; this.cdr.detectChanges();
				return of(null);
			})
		).subscribe({
			next: (data) => {
				if (!data || !data.contractor || !data.store || !data.passType) {
					this.isLoading = false;
					if (!this.errorMessage) this.errorMessage = "Не полные данные для продления.";
					console.error("Не полные данные:", data); this.cdr.detectChanges();
					return;
				}
				const { contractor, store, passType } = data;
				const extendData = {
					contractorId: contractor.id, passTypeId: passType.id, store: store,
					startDate: newStartDate.toISOString(), position: pass.position || 'Наёмный работник',
					contractorDetails: contractor, passType: passType
				};
				this.isLoading = false;
				this.router.navigate(['/transactions/create'], { state: extendData });
			}
		});
	}

	closePass(passId: number, contractorIndex: number, resultIndex: number): void {
		const closeReason = prompt('Причина закрытия:');
		if (closeReason === null) return;
		if (closeReason.trim() === '') { alert('Причина не может быть пустой.'); return; }
		this.isLoading = true;
		this.errorMessage = null;
		this.passService.closePass(passId, closeReason)
			.pipe(
				takeUntil(this.destroy$),
				catchError(err => {
					console.error('Ошибка закрытия:', err);
					let msg = 'Ошибка при закрытии.';
					if (err.error && typeof err.error === 'string') { msg = `Ошибка: ${err.error}`; }
					else if (err.error?.message) { msg = `Ошибка: ${err.error.message}`; }
					else if (err.message) { msg = `Ошибка: ${err.message}`; }
					this.errorMessage = msg;
					this.isLoading = false; this.searchPasses(); this.cdr.detectChanges();
					return of(null);
				})
			)
			.subscribe({
				next: (response) => {
					if (response !== null) {
						this.isLoading = false;
						this.searchPasses();
						this.cdr.detectChanges();
					}
				}
			});
	}

	goToCreateTransaction(storeData: PassByStoreResponseDto): void {
		this.isLoading = true;
		this.errorMessage = null;

		this.transactionService.getStoreByDetails(
			storeData.building, storeData.floor, storeData.line, storeData.storeNumber
		).pipe(
			takeUntil(this.destroy$),
			catchError(err => {
				console.error("Ошибка getStoreByDetails для кнопки в цикле:", err);
				this.errorMessage = `Ошибка получения данных магазина: ${err.message || 'Неизвестная ошибка'}`;
				this.isLoading = false; this.cdr.detectChanges();
				return of(null);
			})
		).subscribe({
			next: (fetchedStore: Store | null) => {
				this.isLoading = false;
				if (!fetchedStore) {
					if (!this.errorMessage) this.errorMessage = `Магазин не найден по указанным параметрам.`;
					this.cdr.detectChanges(); return;
				}
				const navigationState = { store: fetchedStore };
				this.router.navigate(['/transactions/create'], { state: navigationState });
			}
		});
	}

	private addMonths(date: Date, months: number): Date {
		const d = new Date(date);
		d.setMonth(d.getMonth() + months);
		return d;
	}

	private formatDateToYYYYMMDD(d: Date): string {
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		return `${yyyy}-${mm}-${dd}`;
	}

	toggleActivePanel(resultIndex: number, contractorIndex: number): void {
		const k = `${resultIndex}-${contractorIndex}-active`;
		this.allActivePanelStates[k] = !this.allActivePanelStates[k];
	}

	isActivePanelExpanded(resultIndex: number, contractorIndex: number): boolean {
		const k = `${resultIndex}-${contractorIndex}-active`;
		return !!this.allActivePanelStates[k];
	}

	toggleClosedPanel(resultIndex: number, contractorIndex: number): void {
		const k = `${resultIndex}-${contractorIndex}-closed`;
		this.allClosedPanelStates[k] = !this.allClosedPanelStates[k];
	}

	isClosedPanelExpanded(resultIndex: number, contractorIndex: number): boolean {
		const k = `${resultIndex}-${contractorIndex}-closed`;
		return !!this.allClosedPanelStates[k];
	}

	toggleClosedContractorsPanel(resultIndex: number): void {
		const k = `ccp-${resultIndex}`;
		this.closedContractorsPanelStates[k] = !this.closedContractorsPanelStates[k];
	}

	isClosedContractorsPanelExpanded(resultIndex: number): boolean {
		const k = `ccp-${resultIndex}`;
		return !!this.closedContractorsPanelStates[k];
	}

	openImageInNewWindow(url: string | null): void {
		if (url && !url.includes('default-photo.jpg') && !url.includes('default-doc.png')) {
			window.open(url, '_blank');
		}
	}

	trackByResult(index: number, result: PassByStoreResponseDto): string {
		return `${result.building}-${result.floor}-${result.line}-${result.storeNumber}`;
	}

	trackByContractor(index: number, contractor: ContractorPassesDto): number {
		return contractor.contractorId;
	}

	trackByPass(index: number, pass: PassDetailsDto): number {
		return pass.id;
	}
}