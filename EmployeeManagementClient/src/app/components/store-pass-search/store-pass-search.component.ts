import { Component, OnInit, OnDestroy, ViewChildren, QueryList, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PassService } from '../../services/pass.service';
import { BehaviorSubject, Subscription, Observable, of, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { PassByStoreResponseDto, ContractorPassesDto, PassDetailsDto } from '../../models/store-pass-search.model';
import { QueueSyncService } from '../../services/queue-sync.service';
import { TransactionService } from '../../services/transaction.service';
import { SearchFilterResetService } from '../../services/search-filter-reset.service';

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
		MatIconModule
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
	private confirmedFields: { [key: string]: string | null } = {
		Building: null,
		Floor: null,
		Line: null,
		StoreNumber: null
	};
	private allActivePanelStates: { [key: string]: boolean } = {};
	private allClosedPanelStates: { [key: string]: boolean } = {};
	private closedContractorsPanelStates: { [key: string]: boolean } = {};

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
			.subscribe((needsReset) => {
				console.log(`StorePassSearchComponent: Received reset signal value = ${needsReset}`);
				if (needsReset === true) {
					console.log('StorePassSearchComponent: Получен сигнал true, сбрасываем фильтры.');
					this.resetFilters();
					this.searchFilterResetService.consumeReset();
				}
			});

		this.loadStoredSearchCriteria();

		this.initializeAutocompleteHandlers();
	}


	ngAfterViewInit(): void { }

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
		this.resetSubscription?.unsubscribe();
	}

	private loadStoredSearchCriteria(): void {
		const storedCriteria = localStorage.getItem('storeSearchCriteria');
		if (storedCriteria) {
			const criteria = JSON.parse(storedCriteria);
			this.searchForm.patchValue({
				Building: criteria.building || '',
				Floor: criteria.floor || '',
				Line: criteria.line || '',
				StoreNumber: criteria.storeNumber || ''
			});
			this.confirmedFields = {
				Building: criteria.building || null,
				Floor: criteria.floor || null,
				Line: criteria.line || null,
				StoreNumber: criteria.storeNumber || null
			};
			this.searchPasses();
		}
	}

	private saveSearchCriteria(): void {
		const criteria = this.prepareSearchCriteria();
		localStorage.setItem('storeSearchCriteria', JSON.stringify(criteria));
	}

	searchPasses(): void {
		this.errorMessage = null;
		const allFieldsConfirmed = Object.values(this.confirmedFields).every(value => value !== null && value.trim() !== '');
		if (!allFieldsConfirmed) {
			this.errorMessage = 'Выберите значения для всех полей из списка автодополнения';
			return;
		}

		this.isLoading = true;
		const criteria = this.prepareSearchCriteria();

		this.passService.searchPassesByStore(criteria).subscribe({
			next: (response: PassByStoreResponseDto[]) => {
				this.results = response.map((result: PassByStoreResponseDto) => ({
					...result,
					contractors: result.contractors.map((contractor: ContractorPassesDto) => ({
						...contractor,
						activePasses: this.getSortedPasses(contractor.activePasses, result),
						closedPasses: this.getSortedPasses(contractor.closedPasses, result),
						allActivePasses: this.getSortedPasses(contractor.allActivePasses, result)
					}))
				}));
				this.isLoading = false;
				this.saveSearchCriteria();
				this.allActivePanelStates = {};
				this.allClosedPanelStates = {};
				this.closedContractorsPanelStates = {};
			},
			error: (error) => {
				this.errorMessage = error.message || 'Ошибка при выполнении поиска.';
				this.results = [];
				this.isLoading = false;
			}
		});
	}

	resetFilters(): void {
		console.log("Вызван метод resetFilters в StorePassSearchComponent");
		this.searchForm.reset({
			Building: '',
			Floor: '',
			Line: '',
			StoreNumber: ''
		});
		this.confirmedFields = { Building: null, Floor: null, Line: null, StoreNumber: null };
		localStorage.removeItem('storeSearchCriteria');
		this.results = [];
		this.errorMessage = null;
		this.buildingSuggestions$.next([]);
		this.floorSuggestions$.next([]);
		this.lineSuggestions$.next([]);
		this.storeNumberSuggestions$.next([]);
		this.allActivePanelStates = {};
		this.allClosedPanelStates = {};
		this.closedContractorsPanelStates = {};

		this.cdr.detectChanges();
		console.log("Фильтры сброшены, UI должен обновиться.");
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

	initializeAutocompleteHandlers(): void {
		this.setupAutocomplete('Building', this.passService.getBuildingSuggestions.bind(this.passService));
		this.setupAutocomplete('Floor', this.passService.getFloorSuggestions.bind(this.passService));
		this.setupAutocomplete('Line', this.passService.getLineSuggestions.bind(this.passService));
		this.setupAutocomplete('StoreNumber', this.passService.getStoreNumberSuggestions.bind(this.passService));
	}

	setupAutocomplete(controlName: string, suggestionServiceMethod: (query: string) => Observable<string[]>): void {
		const control = this.searchForm.get(controlName);
		if (control) {
			this.subscriptions.push(
				control.valueChanges.pipe(
					debounceTime(300),
					distinctUntilChanged(),
					switchMap(query => {
						const trimmedQuery = query?.trim() || '';
						if (this.confirmedFields[controlName] === trimmedQuery) return of([]);
						if (!trimmedQuery) {
							this.confirmedFields[controlName] = null;
							return of([]);
						}
						return suggestionServiceMethod(trimmedQuery).pipe(
							catchError(() => of([]))
						);
					})
				).subscribe(suggestions => this.getSuggestionSubject(controlName).next(suggestions))
			);
		}
	}

	onInput(controlName: string, event: Event): void {
		const value = (event.target as HTMLInputElement).value.trim();
		if (!this.confirmedFields[controlName] || this.confirmedFields[controlName] !== value) {
			this.confirmedFields[controlName] = null;
		}
	}

	selectSuggestion(controlName: string, value: string): void {
		this.searchForm.get(controlName)?.setValue(value);
		this.confirmedFields[controlName] = value;
		this.getSuggestionSubject(controlName).next([]);
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
			StoreNumber: this.storeNumberSuggestions$
		}[controlName as 'Building' | 'Floor' | 'Line' | 'StoreNumber'];
	}

	formatStore(store: PassByStoreResponseDto): string {
		return `${store.building} ${store.floor} ${store.line} ${store.storeNumber}`.trim();
	}

	getFirstPhotoUrl(pass: ContractorPassesDto): string {
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
		return result.contractors.filter(contractor => contractor.activePasses && contractor.activePasses.length > 0);
	}

	getClosedContractors(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return result.contractors.filter(contractor =>
			(!contractor.activePasses || contractor.activePasses.length === 0) &&
			contractor.closedPasses && contractor.closedPasses.length > 0
		);
	}

	viewContractor(contractorId: number): void {
		this.router.navigate(['/contractors/details', contractorId]);
	}

	editContractor(contractorId: number): void {
		this.router.navigate(['/contractors/edit', contractorId]);
	}

	extendPass(pass: PassDetailsDto, result: PassByStoreResponseDto): void {
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
					return;
				}

				const extendData = {
					contractorId: contractor.id, // ID контрагента
					passTypeId: passType.id,     // ID типа пропуска
					store: {                     // Объект магазина
						id: store.id,
						building: store.building, // Или pass.building, если в store нет этих полей
						floor: store.floor,       // Или pass.floor
						line: store.line,         // Или pass.line
						storeNumber: store.storeNumber // Или pass.storeNumber
					},
					startDate: newStartDate.toISOString(), // Дата начала как строка ISO 8601
					position: pass.position || 'Наёмный работник', // Должность (с запасным вариантом)
					contractorDetails: { // Детали контрагента для отображения в форме
						id: contractor.id,
						lastName: contractor.lastName || '',
						firstName: contractor.firstName || '',
						middleName: contractor.middleName || '',
						passportSerialNumber: contractor.passportSerialNumber || ''
						// Добавьте другие поля, если они нужны в TransactionCreateComponent
					},
					passType: { // Детали типа пропуска для расчетов и отображения
						id: passType.id,
						name: passType.name,
						durationInMonths: passType.durationInMonths,
						cost: passType.cost
					}
				};

				console.log("Подготовлены данные для передачи в state:", extendData);

				// 4. Выполняем навигацию на страницу создания транзакции
				this.isLoading = false; // Скрываем индикатор загрузки
				this.router.navigate(['/transactions/create'], { state: extendData });
			},
			/** Обработчик ошибки при получении данных */
			error: (err) => {
				console.error('Ошибка при загрузке данных для продления через forkJoin:', err);
				// Пытаемся извлечь сообщение об ошибке
				const message = err?.error?.message || err?.message || 'Неизвестная ошибка сервера';
				this.errorMessage = `Ошибка при загрузке данных для продления: ${message}`;
				this.isLoading = false; // Скрываем индикатор загрузки
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

	closePass(passId: number, contractorIndex: number, resultIndex: number): void {
		const closeReason = prompt('Введите причину закрытия пропуска:');
		if (!closeReason) return;

		this.passService.closePass(passId, closeReason).subscribe({
			next: () => {
				this.searchPasses();
			},
			error: (err) => {
				if (err.status === 400) {
					this.searchPasses();
				} else {
					console.error('Ошибка закрытия пропуска:', err);
				}
			}
		});
	}

	toggleActivePanel(resultIndex: number, contractorIndex: number): void {
		const key = `${resultIndex}-${contractorIndex}`;
		this.allActivePanelStates[key] = !this.allActivePanelStates[key];
	}

	isActivePanelExpanded(resultIndex: number, contractorIndex: number): boolean {
		const key = `${resultIndex}-${contractorIndex}`;
		return !!this.allActivePanelStates[key];
	}

	toggleClosedPanel(resultIndex: number, contractorIndex: number): void {
		const key = `${resultIndex}-${contractorIndex}`;
		this.allClosedPanelStates[key] = !this.allClosedPanelStates[key];
	}

	isClosedPanelExpanded(resultIndex: number, contractorIndex: number): boolean {
		const key = `${resultIndex}-${contractorIndex}`;
		return !!this.allClosedPanelStates[key];
	}

	toggleClosedContractorsPanel(resultIndex: number): void {
		const key = `${resultIndex}`;
		this.closedContractorsPanelStates[key] = !this.closedContractorsPanelStates[key];
	}

	isClosedContractorsPanelExpanded(resultIndex: number): boolean {
		const key = `${resultIndex}`;
		return !!this.closedContractorsPanelStates[key];
	}

	openImageInNewWindow(url: string | null): void {
		if (url) {
			window.open(url, '_blank');
		}
	}

	trackByContractor(index: number, contractor: ContractorPassesDto): number {
		return contractor.contractorId;
	}
}