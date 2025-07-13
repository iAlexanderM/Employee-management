import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule, MatDatepickerInputEvent } from '@angular/material/datepicker';
import {
	MatNativeDateModule,
	DateAdapter,
	MAT_DATE_FORMATS,
	MAT_DATE_LOCALE,
	NativeDateAdapter
} from '@angular/material/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatSelectChange } from '@angular/material/select';

import { TransactionService } from '../../../services/transaction.service';
import { TokenService } from '../../../services/token.service';
import { QueueSyncService } from '../../../services/queue-sync.service';
import { SearchFilterResetService } from '../../../services/search-filter-reset.service';
import { PositionService } from '../../../services/position.service';
import { Position } from '../../../models/position.model';
import { ContractorDto, ContractorStorePassCreateDto, CreateTransactionDto } from '../../../models/transaction.model';
import { Store } from '../../../models/store.model';
import { PassType } from '../../../models/pass-type.model';
import { QueueToken } from '../../../models/queue.model';

import { ContractorModalComponent } from '../../modals/contractor-modal/contractor-modal.component';
import { StoreModalComponent } from '../../modals/store-modal/store-modal.component';
import { PassTypeModalComponent } from '../../modals/pass-type-modal/pass-type-modal.component';
import { PositionModalComponent } from '../../modals/position-modal/position-modal.component';

interface TransactionFormData {
	contractor: ContractorDto | null;
	store: Store | null;
	passType: PassType | null;
	totalCost: number;
	form: FormGroup;
	modalPosition?: string;
}
export class AppDateAdapter extends NativeDateAdapter {
	override format(date: Date, displayFormat: Object): string {
		if (displayFormat === 'DD.MM.YYYY') {
			const day = date.getDate();
			const month = date.getMonth() + 1;
			const year = date.getFullYear();
			return `${zeroPad(day, 2)}.${zeroPad(month, 2)}.${year}`;
		}
		return super.format(date, displayFormat);
	}

	override parse(value: any): Date | null {
		if ((typeof value === 'string') && (value.indexOf('.') > -1)) {
			const str = value.split('.');
			const year = Number(str[2]);
			const month = Number(str[1]) - 1; // Month is 0-indexed
			const day = Number(str[0]);
			return new Date(year, month, day);
		}
		const timestamp = typeof value === 'number' ? value : Date.parse(value);
		return isNaN(timestamp) ? null : new Date(timestamp);
	}
}

const zeroPad = (num: number, places: number) => String(num).padStart(places, '0');

const MY_DATE_FORMATS = {
	parse: {
		dateInput: 'DD.MM.YYYY',
	},
	display: {
		dateInput: 'DD.MM.YYYY',
		monthYearLabel: 'MMM YYYY',
		dateA11yLabel: 'LL',
		monthYearA11yLabel: 'MMMM YYYY',
	},
};

@Component({
	selector: 'app-transaction-create',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatIconModule,
		MatButtonModule,
		MatSelectModule,
		MatDatepickerModule,
		MatNativeDateModule,
		MatGridListModule,
		MatCardModule,
		ContractorModalComponent,
		StoreModalComponent,
		PassTypeModalComponent,
		PositionModalComponent
	],
	providers: [
		{ provide: DateAdapter, useClass: AppDateAdapter, deps: [MAT_DATE_LOCALE] },
		{ provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
	],
	templateUrl: './transaction-create.component.html',
	styleUrls: ['./transaction-create.component.css'],
})
export class TransactionCreateComponent implements OnInit, OnDestroy {
	transactionForms: TransactionFormData[] = [];
	errorMessage: string = '';
	isLoading: boolean = true;
	activeTokenData: QueueToken | null = null;

	allPositions: Position[] = [];
	filteredPositions: Position[] = [];
	readonly manualEntryPositionName: string = 'Наемный работник';
	public manualEntryPositionId: number | null = null;

	private destroy$ = new Subject<void>();
	private tokenSubscription!: Subscription;
	private hasLoadedFromStorage = false;
	private processedStates = new Set<string>();
	private isExtending = false;

	constructor(
		private fb: FormBuilder,
		private transactionService: TransactionService,
		private tokenService: TokenService,
		private queueSyncService: QueueSyncService,
		private router: Router,
		private cdr: ChangeDetectorRef,
		private searchFilterResetService: SearchFilterResetService,
		private positionService: PositionService
	) { }

	ngOnInit(): void {
		const initialToken = this.queueSyncService.getActiveToken();
		const state = history.state;

		console.log('ngOnInit вызван с initialToken:', initialToken, 'state:', state);

		this.isLoading = true;
		this.positionService.getPositions(1, 100).pipe(
			takeUntil(this.destroy$)
		).subscribe({
			next: (response) => {
				this.allPositions = response.positions;
				this.filteredPositions = this.allPositions.filter(p => p.id >= 1 && p.id <= 4);
				const foundManualPosition = this.allPositions.find(p => p.name === this.manualEntryPositionName);
				if (foundManualPosition) {
					this.manualEntryPositionId = foundManualPosition.id;
				} else {
					console.warn(`Должность '${this.manualEntryPositionName}' не найдена в списке должностей с бэкенда.`);
				}

				if (!this.hasLoadedFromStorage) {
					this.activeTokenData = initialToken ? { token: initialToken } as QueueToken : null;
					this.loadFromLocalStorage(initialToken || '');
					this.hasLoadedFromStorage = true;
				}

				if (state && state.contractorId && state.passTypeId && state.store) {
					const stateKey = `${JSON.stringify(state)}_${Date.now()}`;
					if (!this.processedStates.has(stateKey)) {
						console.log('Обрабатывается новое состояние для продления:', state);
						this.handleExtendPass(state);
						this.processedStates.add(stateKey);
						history.replaceState({}, document.title, window.location.pathname);
					} else {
						console.log('Состояние уже обработано, пропускаем:', state);
					}
				} else if (state && state.store && !state.contractorId && !state.passTypeId && !this.processedStates.has(JSON.stringify(state))) {
					console.log('Обработка state для создания транзакции с предзаполненной торговой точкой:', state);
					this.handleCreateTransactionWithStore(state.store);
					this.processedStates.add(JSON.stringify(state));
					history.replaceState({}, document.title, window.location.pathname);
				}

				if (!this.transactionForms.length) {
					this.addTransactionForm();
				}

				this.isLoading = false;
				this.cdr.detectChanges();

				this.tokenSubscription = this.queueSyncService.activeToken$
					.pipe(takeUntil(this.destroy$))
					.subscribe(token => {
						if (token && token !== this.activeTokenData?.token) {
							console.log('Токен изменен на:', token);
							const oldActiveToken = this.activeTokenData?.token;

							if (oldActiveToken) {
								this.saveToLocalStorage();
							}

							this.activeTokenData = { token } as QueueToken;
							this.transactionForms.forEach(formData => formData.form.patchValue({ token }));

							const savedDataForNewToken = localStorage.getItem(`transactionForms_${token}`);
							if (savedDataForNewToken) {
								this.loadFromLocalStorage(token);
								console.log(`Загружены существующие данные для НОВОГО токена: ${token}.`);
							} else if (!oldActiveToken) {
								console.log(`Переносим данные из черновика на новый токен: ${token}.`);
								this.loadFromLocalStorage('');
								this.transactionForms.forEach(formData => formData.form.patchValue({ token }));
							} else {
								console.log(`Нет данных для нового токена ${token}, и не было черновика. Начинаем с чистой формы.`);
								this.transactionForms = [];
								this.addTransactionForm();
							}

							this.saveToLocalStorage();
							localStorage.removeItem('transactionForms_DRAFT');
							console.log('Черновик (DRAFT) удален из localStorage.');

							if (oldActiveToken && oldActiveToken !== token) {
								localStorage.removeItem(`transactionForms_${oldActiveToken}`);
								console.log(`Очищены старые данные формы для предыдущего талона ${oldActiveToken} из localStorage.`);
							}
						} else if (!token && this.activeTokenData?.token) {
							console.log('Токен был очищен. Очищаем данные форм.');
							const oldToken = this.activeTokenData?.token;
							if (oldToken) {
								localStorage.removeItem(`transactionForms_${oldToken}`);
								console.log(`Очищены данные формы для талона ${oldToken} из localStorage.`);
							}
							this.activeTokenData = null;
							this.transactionForms.forEach(formData => formData.form.patchValue({ token: '' }));

							localStorage.removeItem('transactionForms_DRAFT');
							console.log('Черновик (DRAFT) данных формы удален из localStorage, так как токен был очищен.');

							this.transactionForms = [];
							this.addTransactionForm();
							this.cdr.detectChanges();
						} else if (!token && !this.activeTokenData?.token) {
							console.log('Токен пуст, нет активного токена. Не делаем никаких изменений в формах.');
						}
					});
			},
			error: (err) => {
				this.errorMessage = 'Ошибка при загрузке должностей: ' + (err.error?.message || 'Неизвестная ошибка');
				this.isLoading = false;
				this.cdr.detectChanges();
				console.error('Ошибка загрузки должностей:', err);
			}
		});

		console.log('Значения форм в ngOnInit после всех операций:', this.transactionForms.map(f => f.form.getRawValue()));
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.tokenSubscription) this.tokenSubscription.unsubscribe();
	}

	handleExtendPass(state: any): void {
		console.log('handleExtendPass вызван с состоянием:', state);

		const formData = this.addTransactionForm();

		const contractorId = state.contractorId;
		const store = state.store;
		const passTypeId = state.passTypeId;
		const startDate = state.startDate ? new Date(state.startDate) : new Date();

		const contractorDetails = state.contractorDetails;
		const originalPassId = state.originalPassId;
		const passType = state.passType;

		const basePositions = this.filteredPositions.map(p => p.name);
		const incomingPosition = state.position;
		let formPositionValue: string;
		let modalPositionValue: string | undefined;

		if (incomingPosition && basePositions.includes(incomingPosition)) {
			formPositionValue = incomingPosition;
			modalPositionValue = undefined;
		} else if (incomingPosition) {
			formPositionValue = this.manualEntryPositionName;
			modalPositionValue = incomingPosition;
		} else {
			formPositionValue = '';
			modalPositionValue = undefined;
		}

		formData.contractor = contractorDetails || null;
		formData.store = store || null;
		formData.passType = passType || null;
		formData.totalCost = passType?.cost || 0;
		formData.modalPosition = modalPositionValue;

		formData.form.patchValue({
			contractorId: contractorId,
			storeId: store?.id,
			passTypeId: passTypeId,
			startDate: startDate,
			position: formPositionValue,
			endDate: this.addMonths(startDate, passType?.durationInMonths || 0),
			token: this.activeTokenData?.token || '',
			originalPassId: originalPassId
		});

		console.log('Новая форма добавлена и заполнена данными продления:', formData.form.getRawValue());
		console.log('Все формы после добавления:', this.transactionForms.map(f => f.form.getRawValue()));

		this.saveToLocalStorage();
		this.isLoading = false;
		this.cdr.detectChanges();
		this.isExtending = false;
	}

	createTransaction(): void {
		const invalidForms = this.transactionForms.filter(formData =>
			formData.form.invalid || !formData.contractor || !formData.store || !formData.passType || !formData.form.get('position')?.value
		);

		if (invalidForms.length > 0) {
			this.errorMessage = 'Все обязательные поля должны быть заполнены.';
			return;
		}

		const contractorStorePasses = this.transactionForms.map(formData => {
			const fv = formData.form.getRawValue();
			const positionToSend = fv.position === this.manualEntryPositionName && formData.modalPosition ? formData.modalPosition : fv.position;
			return {
				contractorId: fv.contractorId,
				storeId: fv.storeId,
				passTypeId: fv.passTypeId,
				position: positionToSend,
				originalPassId: fv.originalPassId || null
			} as ContractorStorePassCreateDto;
		});

		const firstFormValue = this.transactionForms[0].form.getRawValue();
		const transaction: CreateTransactionDto = {
			token: firstFormValue.token,
			contractorStorePasses,
			startDate: firstFormValue.startDate,
			endDate: firstFormValue.endDate
		};

		console.log('Транзакция для отправки:', JSON.stringify(transaction, null, 2));

		this.transactionService.createTransaction(transaction).subscribe({
			next: () => {
				this.clearLocalStorage();
				console.log('Вызов triggerReset() из TransactionCreateComponent после успешного создания.');
				this.searchFilterResetService.triggerReset();
				this.router.navigate(['/transactions']);
			},
			error: (err) => {
				this.errorMessage = 'Ошибка при создании транзакции: ' + (err.error?.message || 'Неверный запрос');
				console.error('Ошибка создания транзакции:', err);
			}
		});
	}

	addTransactionForm(): TransactionFormData {
		console.trace('Стек вызовов addTransactionForm');
		const newForm = this.createFormGroup();
		const formData: TransactionFormData = {
			contractor: null,
			store: null,
			passType: null,
			totalCost: 0,
			form: newForm
		};
		this.transactionForms.push(formData);
		this.initAutoEndDateCalc(newForm);
		this.saveToLocalStorage();
		this.cdr.detectChanges();
		console.log('Добавлена новая форма, всего форм:', this.transactionForms.length);
		return formData;
	}

	removeTransactionForm(index: number): void {
		if (this.transactionForms.length > 1) {
			this.transactionForms.splice(index, 1);
		} else {
			this.resetForm(this.transactionForms[0]);
		}
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	openContractorModal(index: number): void {
		this.transactionForms[index].form.patchValue({ showContractorModal: true });
	}

	openStoreModal(index: number): void {
		this.transactionForms[index].form.patchValue({ showStoreModal: true });
	}

	openPassTypeModal(index: number): void {
		this.transactionForms[index].form.patchValue({ showPassTypeModal: true });
	}

	openPositionModal(index: number): void {
		this.transactionForms[index].form.patchValue({ showPositionModal: true });
	}

	contractorSelected(index: number, contractor: ContractorDto): void {
		const formData = this.transactionForms[index];
		formData.contractor = contractor;
		formData.form.patchValue({ contractorId: contractor.id, showContractorModal: false });
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	storeSelected(index: number, store: Store): void {
		const formData = this.transactionForms[index];
		formData.store = store;
		formData.form.patchValue({ storeId: store.id, showStoreModal: false });
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	passTypeSelected(index: number, passType: PassType): void {
		const formData = this.transactionForms[index];
		formData.passType = passType;
		formData.form.patchValue({ passTypeId: passType.id, showPassTypeModal: false });
		this.calculateEndDate(formData);
		this.calculateTotalCost(formData);
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	onPositionChange(index: number, event: MatSelectChange): void {
		const value = event.value;
		const formData = this.transactionForms[index];
		if (value !== this.manualEntryPositionName) {
			formData.modalPosition = undefined;
		}
		formData.form.patchValue({ position: value });
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	positionSelected(index: number, position: string): void {
		const formData = this.transactionForms[index];
		formData.modalPosition = position;
		formData.form.patchValue({ position: this.manualEntryPositionName, showPositionModal: false });
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	getTotalCost(): number {
		return this.transactionForms.reduce((sum, formData) => sum + (formData.totalCost || 0), 0);
	}

	private createFormGroup(): FormGroup {
		const form = this.fb.group({
			token: [{ value: this.activeTokenData?.token || '', disabled: true }, Validators.required],
			contractorId: [null, Validators.required],
			storeId: [null, Validators.required],
			passTypeId: [null, Validators.required],
			startDate: [new Date(), Validators.required],
			// Removed 'disabled: true' from endDate to fix transparency
			endDate: [null, Validators.required],
			position: ['', Validators.required],
			showContractorModal: [false],
			showStoreModal: [false],
			showPassTypeModal: [false],
			showPositionModal: [false],
			originalPassId: [null]
		});
		form.get('showPositionModal')?.valueChanges.subscribe(value => {
			console.log('showPositionModal changed to:', value);
		});
		return form;
	}

	private initAutoEndDateCalc(form: FormGroup): void {
		form.get('startDate')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
			const formData = this.transactionForms.find(f => f.form === form);
			if (formData) this.calculateEndDate(formData);
		});

		form.get('passTypeId')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
			const formData = this.transactionForms.find(f => f.form === form);
			if (formData) this.calculateEndDate(formData);
		});
	}

	private calculateEndDate(formData: TransactionFormData): void {
		const form = formData.form;
		const startDate = form.get('startDate')?.value;
		const passType = formData.passType;
		if (!startDate || !passType) return;

		const endDate = this.addMonths(startDate, passType.durationInMonths || 0);
		form.patchValue({ endDate: endDate }, { emitEvent: false });
	}

	private calculateTotalCost(formData: TransactionFormData): void {
		formData.totalCost = formData.passType?.cost || 0;
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

	private saveToLocalStorage(): void {
		const storageKey = this.activeTokenData?.token
			? `transactionForms_${this.activeTokenData.token}`
			: 'transactionForms_DRAFT';

		const dataToSave = this.transactionForms.map(formData => ({
			contractor: formData.contractor,
			store: formData.store,
			passType: formData.passType,
			totalCost: formData.totalCost,
			// Convert Date objects to ISO strings for storage
			formValue: {
				...formData.form.getRawValue(),
				startDate: formData.form.get('startDate')?.value instanceof Date ? formData.form.get('startDate')?.value.toISOString() : null,
				endDate: formData.form.get('endDate')?.value instanceof Date ? formData.form.get('endDate')?.value.toISOString() : null,
				// Ensure showModal fields are boolean for storage consistency
				showContractorModal: !!formData.form.get('showContractorModal')?.value,
				showStoreModal: !!formData.form.get('showStoreModal')?.value,
				showPassTypeModal: !!formData.form.get('showPassTypeModal')?.value,
				showPositionModal: !!formData.form.get('showPositionModal')?.value,
			},
			modalPosition: formData.modalPosition
		}));

		localStorage.setItem(storageKey, JSON.stringify(dataToSave));
		console.log(`Сохранено в localStorage по ключу '${storageKey}':`, dataToSave);
	}

	private loadFromLocalStorage(token: string): void {
		let savedData: string | null = null;
		let loadedToken: string | null = null;

		if (token) {
			savedData = localStorage.getItem(`transactionForms_${token}`);
			loadedToken = token;
			console.log(`Попытка загрузки данных для активного токена '${token}'.`);
		} else {
			savedData = localStorage.getItem('transactionForms_DRAFT');
			loadedToken = 'DRAFT';
			console.log('Попытка загрузки черновика (DRAFT) данных формы.');
		}

		if (savedData) {
			const parsedData = JSON.parse(savedData);
			this.transactionForms = parsedData.map((data: any) => {
				const form = this.createFormGroup();
				const basePositions = this.filteredPositions.map(p => p.name);

				const savedFormPosition = data.formValue.position;
				const savedModalPosition = data.modalPosition;

				let formPositionValue: string;
				let modalPositionValueForUI: string | undefined;
				if (savedFormPosition === this.manualEntryPositionName) {
					formPositionValue = this.manualEntryPositionName;
					modalPositionValueForUI = savedModalPosition;
				} else if (savedFormPosition && basePositions.includes(savedFormPosition)) {
					formPositionValue = savedFormPosition;
					modalPositionValueForUI = undefined;
				} else {
					formPositionValue = '';
					modalPositionValueForUI = undefined;
				}

				// Convert ISO strings back to Date objects from storage
				const startDateFromStorage = data.formValue.startDate ? new Date(data.formValue.startDate) : new Date();
				const endDateFromStorage = data.formValue.endDate ? new Date(data.formValue.endDate) : null;


				form.patchValue({
					...data.formValue,
					token: loadedToken === 'DRAFT' ? '' : data.formValue.token,
					position: formPositionValue,
					startDate: startDateFromStorage,
					endDate: endDateFromStorage,
					originalPassId: data.formValue.originalPassId || null,
					showContractorModal: !!data.formValue.showContractorModal,
					showStoreModal: !!data.formValue.showStoreModal,
					showPassTypeModal: !!data.formValue.showPassTypeModal,
					showPositionModal: !!data.formValue.showPositionModal,
				});
				this.initAutoEndDateCalc(form);
				return {
					contractor: data.contractor,
					store: data.store,
					passType: data.passType,
					totalCost: data.totalCost || 0,
					form,
					modalPosition: modalPositionValueForUI
				};
			});
			console.log(`Загружено из localStorage по ключу '${loadedToken}':`, this.transactionForms.map(f => f.form.getRawValue()));
		} else {
			this.transactionForms = [];
			console.log(`Ничего не найдено в localStorage для '${loadedToken}'.`);
		}
		this.cdr.detectChanges();
	}

	private clearLocalStorage(): void {
		if (this.activeTokenData?.token) {
			localStorage.removeItem(`transactionForms_${this.activeTokenData.token}`);
			console.log(`Данные формы для талона ${this.activeTokenData.token} удалены из localStorage после успешной транзакции.`);
		}
		localStorage.removeItem('transactionForms_DRAFT');
		console.log('Черновик (DRAFT) данных формы удален из localStorage.');
	}

	private resetForm(formData: TransactionFormData): void {
		formData.form.reset({
			token: this.activeTokenData?.token || '',
			contractorId: null,
			storeId: null,
			passTypeId: null,
			startDate: new Date(),
			endDate: null,
			position: '',
			showContractorModal: false,
			showStoreModal: false,
			showPassTypeModal: false,
			showPositionModal: false
		});
		formData.contractor = null;
		formData.store = null;
		formData.passType = null;
		formData.totalCost = 0;
		formData.modalPosition = undefined;
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	handleCreateTransactionWithStore(store: Store): void {
		console.log('handleCreateTransactionWithStore вызван с магазином:', store);

		if (!store || !store.id || !store.building || !store.floor || !store.line || !store.storeNumber) {
			this.errorMessage = 'Неверные данные магазина для создания транзакции.';
			this.isLoading = false;
			this.cdr.detectChanges();
			return;
		}

		const formData = this.addTransactionForm();
		formData.store = store;
		formData.form.patchValue({
			storeId: store.id,
			startDate: new Date(),
			token: this.activeTokenData?.token || ''
		});

		console.log('Новая форма добавлена с предзаполненной торговой точкой:', formData.form.getRawValue());
		console.log('Все формы после добавления:', this.transactionForms.map(f => f.form.getRawValue()));

		this.saveToLocalStorage();
		this.isLoading = false;
		this.cdr.detectChanges();
	}

	onStartDateChange(event: MatDatepickerInputEvent<Date>, formIndex: number): void {
		console.log('startDate изменена через календарь:', event.value);
		this.cdr.detectChanges();
		this.saveToLocalStorage();
	}
}