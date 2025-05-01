import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, Observable, of, forkJoin } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';

import { PassService } from '../../services/pass.service';
import { TransactionService } from '../../services/transaction.service';
import { SearchFilterResetService } from '../../services/search-filter-reset.service';
import { PassByStoreResponseDto, ContractorPassesDto, PassDetailsDto } from '../../models/store-pass-search.model';
import { Store } from '../../models/transaction.model';
import { environment } from '../../../environments/environment';

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
		MatTooltipModule
	],
	templateUrl: './store-pass-search.component.html',
	styleUrls: ['./store-pass-search.component.css'],
})
export class StorePassSearchComponent implements OnInit, OnDestroy, AfterViewInit {
	searchForm: FormGroup;
	results: PassByStoreResponseDto[] = [];
	isLoading = false;
	errorMessage: string | null = null;
	showAddTransactionButton = false;
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
		StoreNumber: null,
	};
	private panelStates: { [key: string]: boolean } = {};

	// Virtual scrolling properties
	private allContractors: { resultIndex: number; contractor: ContractorPassesDto; isActive: boolean }[] = [];
	public windows: { [resultIndex: number]: { start: number; end: number } } = {};
	private windowSize = 100;
	private windowStep = 50;
	private observer: IntersectionObserver | null = null;

	constructor(
		private fb: FormBuilder,
		private passService: PassService,
		private transactionService: TransactionService,
		private router: Router,
		private searchFilterResetService: SearchFilterResetService,
		private cdr: ChangeDetectorRef,
		private zone: NgZone
	) {
		this.searchForm = this.fb.group({
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: [''],
		});
	}

	ngOnInit(): void {
		this.resetSubscription = this.searchFilterResetService.resetTrigger$.subscribe((needsReset) => {
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
			{ root: null, threshold: 0.1, rootMargin: '200px' } // Use page scroll (null root)
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
			const closedContractors = this.getClosedContractors(result).map((contractor) => ({
				resultIndex,
				contractor,
				isActive: false,
			}));
			this.allContractors.push(...activeContractors, ...closedContractors);
			this.windows[resultIndex] = { start: 0, end: this.windowSize };
		});
		if (environment.debug) {
			console.log(`[PrepareContractors] Total contractors: ${this.allContractors.length}`);
			this.results.forEach((_, resultIndex) => {
				const count = this.allContractors.filter((c) => c.resultIndex === resultIndex).length;
				console.log(`[PrepareContractors][${resultIndex}] Contractors: ${count}`);
			});
		}
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
		this.showAddTransactionButton = false;
		this.results = [];
		this.resetVirtualScrollState();

		const allFieldsConfirmed = Object.values(this.confirmedFields).every((value) => value !== null && value.trim() !== '');
		if (!allFieldsConfirmed) {
			this.errorMessage = 'Выберите значения для всех полей из списка автодополнения';
			return;
		}

		this.isLoading = true;
		const criteria = this.prepareSearchCriteria();

		this.passService
			.searchPassesByStore(criteria)
			.pipe(
				catchError((error) => {
					this.errorMessage = error?.status === 404 ? 'Торговая точка не найдена или не существует.' : error?.message || 'Ошибка при выполнении поиска.';
					this.results = [];
					this.isLoading = false;
					this.resetVirtualScrollState();
					this.cdr.markForCheck();
					return of([]);
				})
			)
			.subscribe((response: PassByStoreResponseDto[]) => {
				this.results = response.map((result) => ({
					...result,
					contractors: (result.contractors || []).map((contractor) => ({
						...contractor,
						activePasses: this.getSortedPasses(contractor.activePasses, result),
						closedPasses: this.getSortedPasses(contractor.closedPasses, result),
					})),
				}));
				this.isLoading = false;
				this.saveSearchCriteria();
				this.panelStates = {};
				this.showAddTransactionButton = true;
				this.prepareContractorsForVirtualScroll();
				setTimeout(() => this.updateObservers(), 100);
				this.cdr.markForCheck();
			});
	}

	resetFilters(): void {
		this.searchForm.reset({ Building: '', Floor: '', Line: '', StoreNumber: '' });
		this.confirmedFields = { Building: null, Floor: null, Line: null, StoreNumber: null };
		localStorage.removeItem('storeSearchCriteria');
		this.results = [];
		this.errorMessage = null;
		this.buildingSuggestions$.next([]);
		this.floorSuggestions$.next([]);
		this.lineSuggestions$.next([]);
		this.storeNumberSuggestions$.next([]);
		this.panelStates = {};
		this.resetVirtualScrollState();
		this.cdr.detectChanges();
	}

	prepareSearchCriteria(): any {
		return {
			building: this.confirmedFields['Building'] || '',
			floor: this.confirmedFields['Floor'] || '',
			line: this.confirmedFields['Line'] || '',
			storeNumber: this.confirmedFields['StoreNumber'] || '',
			showActive: true,
			showClosed: true,
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
				control.valueChanges
					.pipe(
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
					.subscribe((suggestions) => this.getSuggestionSubject(controlName).next(suggestions))
			);
		}
	}

	onInput(controlName: string, event: Event): void {
		const value = (event.target as HTMLInputElement).value.trim();
		if (!this.confirmedFields[controlName] || this.confirmedFields[controlName] !== value) {
			this.confirmedFields[controlName] = null;
		}
	}

	selectSuggestion(controlName: string, event: MatAutocompleteSelectedEvent): void {
		const value = event.option.value;
		this.searchForm.get(controlName)?.setValue(value, { emitEvent: false });
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

	getClosedContractors(result: PassByStoreResponseDto): ContractorPassesDto[] {
		return result.contractors.filter(
			(contractor) => (!contractor.activePasses || contractor.activePasses.length === 0) && contractor.closedPasses && contractor.closedPasses.length > 0
		);
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
			if (isNaN(previousEndDate.getTime())) {
				throw new Error(`Invalid pass end date format: ${pass.endDate}`);
			}
			newStartDate = new Date(previousEndDate);
			newStartDate.setDate(newStartDate.getDate() + 1);
		} catch (error) {
			this.errorMessage = 'Неверный формат даты окончания предыдущего пропуска.';
			return;
		}

		this.isLoading = true;
		this.errorMessage = null;

		forkJoin({
			contractor: this.transactionService.getContractorById(pass.contractorId),
			store: this.transactionService.getStoreByDetails(pass.building, pass.floor, pass.line, pass.storeNumber),
			passType: this.transactionService.getPassTypeById(pass.passTypeId),
		}).subscribe({
			next: (response: { contractor: any; store: Store; passType: any }) => {
				const { contractor, store, passType } = response;
				if (!contractor || !store || !passType) {
					this.errorMessage = 'Не удалось получить все данные (контрагент, магазин или тип пропуска) для продления.';
					this.isLoading = false;
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
						storeNumber: store.storeNumber,
					},
					startDate: newStartDate.toISOString(),
					position: pass.position || 'Наёмный работник',
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
					originalPassId: pass.id,
				};
				this.isLoading = false;
				this.router.navigate(['/transactions/create'], { state: extendData });
			},
			error: (err: any) => {
				const message = err?.error?.message || err?.message || 'Неизвестная ошибка сервера';
				this.errorMessage = `Ошибка при загрузке данных для продления: ${message}`;
				this.isLoading = false;
			},
		});
	}

	closePass(passId: number): void {
		const closeReason = prompt('Введите причину закрытия пропуска:');
		if (!closeReason) return;

		this.passService.closePass(passId, closeReason).subscribe({
			next: () => {
				this.searchPasses();
			},
			error: (err: any) => {
				if (err.status === 400) {
					this.searchPasses();
				} else {
					this.errorMessage = 'Ошибка закрытия пропуска';
				}
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
				catchError((err) => {
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

	getNameParts(fullName: string): string[] {
		if (!fullName) return ['', '', ''];
		const parts = fullName.trim().split(' ');
		return [
			parts[0] || '',
			parts[1] || '',
			parts.slice(2).join(' ') || ''
		];
	}
}