import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TransactionService } from '../../../services/transaction.service';
import { TokenService } from '../../../services/token.service';
import { QueueSyncService } from '../../../services/queue-sync.service';
import { SearchFilterResetService } from '../../../services/search-filter-reset.service';
import { ContractorDto, Store, PassType, ContractorStorePassCreateDto, CreateTransactionDto } from '../../../models/transaction.model';
import { QueueToken } from '../../../models/queue.model';

import { ContractorModalComponent } from '../../modals/contractor-modal/contractor-modal.component';
import { StoreModalComponent } from '../../modals/store-modal/store-modal.component';
import { PassTypeModalComponent } from '../../modals/pass-type-modal/pass-type-modal.component';
import { PositionModalComponent } from '../../modals/position-modal/position-modal.component';
import { ActiveTokenComponent } from '../../modals/active-token/active-token-floating.component';

interface TransactionFormData {
	contractor: ContractorDto | null;
	store: Store | null;
	passType: PassType | null;
	totalCost: number;
	form: FormGroup;
	modalPosition?: string;
}

@Component({
	selector: 'app-transaction-create',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		ContractorModalComponent,
		StoreModalComponent,
		PassTypeModalComponent,
		PositionModalComponent,
		ActiveTokenComponent
	],
	templateUrl: './transaction-create.component.html',
	styleUrls: ['./transaction-create.component.css']
})
export class TransactionCreateComponent implements OnInit, OnDestroy {
	transactionForms: TransactionFormData[] = [];
	errorMessage: string = '';
	isLoading: boolean = true;
	activeTokenData: QueueToken | null = null;

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
		private searchFilterResetService: SearchFilterResetService
	) { }

	ngOnInit(): void {
		const initialToken = this.queueSyncService.getActiveToken();
		const state = history.state;

		console.log('ngOnInit вызван с initialToken:', initialToken, 'state:', state);

		if (initialToken && !this.hasLoadedFromStorage) {
			this.activeTokenData = { token: initialToken } as QueueToken;
			this.loadFromLocalStorage(initialToken);
			this.hasLoadedFromStorage = true;
		}

		if (state && state.contractorId && state.passTypeId && state.store) {
			const stateKey = `${JSON.stringify(state)}_${Date.now()}`;
			if (!this.processedStates.has(stateKey)) {
				console.log('Обрабатывается новое состояние:', state);
				this.handleExtendPass(state);
				this.processedStates.add(stateKey);
				history.replaceState({}, document.title, window.location.pathname);
			} else {
				console.log('Состояние уже обработано, пропускаем:', state);
			}
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
					this.activeTokenData = { token } as QueueToken;
					this.transactionForms.forEach(formData => formData.form.patchValue({ token }));
					this.saveToLocalStorage();
				} else if (!token) {
					console.log('Токен очищен');
					this.activeTokenData = null;
					this.transactionForms.forEach(formData => formData.form.patchValue({ token: '' }));
					this.saveToLocalStorage();
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
		// ... (проверка isExtending) ...
		console.log('handleExtendPass вызван с состоянием:', state);

		const formData = this.addTransactionForm(); // Добавляем форму для данных продления

		const contractorId = state.contractorId;
		const store = state.store; // Получаем объект Store из state
		const passTypeId = state.passTypeId;
		// Парсим дату из ISO строки, переданной в state
		const startDate = state.startDate ? this.formatDateToYYYYMMDD(new Date(state.startDate)) : this.formatDateToYYYYMMDD(new Date());
		const position = state.position;
		const passType = state.passType; // Получаем объект PassType из state
		const contractorDetails = state.contractorDetails; // Получаем детали контрагента

		const basePositions = ['Сотрудник', 'Подрядчик', 'Наёмный работник'];
		const isBasePosition = basePositions.includes(position);
		const formPositionValue = isBasePosition ? position : 'Наёмный работник';
		// Сохраняем оригинальную позицию, если она не базовая
		const modalPosition = isBasePosition ? undefined : position;

		// Заполняем не только form.patchValue, но и свойства formData
		formData.contractor = contractorDetails || null;
		formData.store = store || null;
		formData.passType = passType || null;
		formData.totalCost = passType?.cost || 0;
		formData.modalPosition = modalPosition; // Сохраняем позицию для модалки

		formData.form.patchValue({
			contractorId: contractorId,
			storeId: store?.id, // Используем ID из объекта store
			passTypeId: passTypeId,
			startDate: startDate, // Используем отформатированную дату
			position: formPositionValue,
			endDate: this.formatDateToYYYYMMDD(this.addMonths(new Date(startDate), passType?.durationInMonths || 0)),
			token: this.activeTokenData?.token || '' // Убедись, что токен устанавливается
		});

		console.log('Новая форма добавлена и заполнена данными продления:', formData.form.getRawValue());
		console.log('Все формы после добавления:', this.transactionForms.map(f => f.form.getRawValue()));

		this.saveToLocalStorage(); // Сохраняем состояние с одной (новой) формой
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
			const positionToSend = fv.position === 'Наёмный работник' && formData.modalPosition ? formData.modalPosition : fv.position;
			return {
				contractorId: fv.contractorId,
				storeId: fv.storeId,
				passTypeId: fv.passTypeId,
				position: positionToSend
			} as ContractorStorePassCreateDto;
		});

		const firstFormValue = this.transactionForms[0].form.getRawValue();
		const transaction: CreateTransactionDto = {
			token: firstFormValue.token,
			contractorStorePasses,
			startDate: new Date(firstFormValue.startDate),
			endDate: new Date(firstFormValue.endDate)
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

	onPositionChange(index: number, event: Event): void {
		const value = (event.target as HTMLSelectElement).value;
		const formData = this.transactionForms[index];
		if (value !== 'Наёмный работник') {
			formData.modalPosition = undefined;
		}
		formData.form.patchValue({ position: value });
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	positionSelected(index: number, position: string): void {
		const formData = this.transactionForms[index];
		formData.modalPosition = position;
		formData.form.patchValue({ position: 'Наёмный работник', showPositionModal: false });
		this.saveToLocalStorage();
		this.cdr.detectChanges();
	}

	getTotalCost(): number {
		return this.transactionForms.reduce((sum, formData) => sum + (formData.totalCost || 0), 0);
	}

	formatDateDisplay(dateStr: string): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
	}

	private createFormGroup(): FormGroup {
		return this.fb.group({
			token: [{ value: this.activeTokenData?.token || '', disabled: true }, Validators.required],
			contractorId: [null, Validators.required],
			storeId: [null, Validators.required],
			passTypeId: [null, Validators.required],
			startDate: [this.formatDateToYYYYMMDD(new Date()), Validators.required],
			endDate: [{ value: '', disabled: true }, Validators.required],
			position: ['', Validators.required],
			showContractorModal: [false],
			showStoreModal: [false],
			showPassTypeModal: [false],
			showPositionModal: [false]
		});
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

		const endDate = this.addMonths(new Date(startDate), passType.durationInMonths || 0);
		form.patchValue({ endDate: this.formatDateToYYYYMMDD(endDate) }, { emitEvent: false });
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
		if (!this.activeTokenData?.token) return;

		const dataToSave = this.transactionForms.map(formData => ({
			contractor: formData.contractor,
			store: formData.store,
			passType: formData.passType,
			totalCost: formData.totalCost,
			formValue: formData.form.getRawValue(),
			modalPosition: formData.modalPosition
		}));

		localStorage.setItem(`transactionForms_${this.activeTokenData.token}`, JSON.stringify(dataToSave));
		console.log('Сохранено в localStorage:', dataToSave);
	}

	private loadFromLocalStorage(token: string): void {
		const savedData = localStorage.getItem(`transactionForms_${token}`);
		if (savedData) {
			const parsedData = JSON.parse(savedData);
			this.transactionForms = parsedData.map((data: any) => {
				const form = this.createFormGroup();
				const basePositions = ['Сотрудник', 'Подрядчик', 'Наёмный работник'];
				const position = data.formValue.position;
				const isBasePosition = basePositions.includes(position);
				const formPositionValue = isBasePosition ? position : 'Наёмный работник';
				const modalPosition = isBasePosition ? undefined : position;

				form.patchValue({
					...data.formValue,
					position: formPositionValue,
					startDate: data.formValue.startDate || this.formatDateToYYYYMMDD(new Date())
				});
				this.initAutoEndDateCalc(form);
				return {
					contractor: data.contractor,
					store: data.store,
					passType: data.passType,
					totalCost: data.totalCost || 0,
					form,
					modalPosition: data.modalPosition || modalPosition
				};
			});
			console.log('Загружено из localStorage:', this.transactionForms.map(f => f.form.getRawValue()));
		} else {
			this.transactionForms = [];
		}
		this.cdr.detectChanges();
	}

	private clearLocalStorage(): void {
		if (this.activeTokenData?.token) {
			localStorage.removeItem(`transactionForms_${this.activeTokenData.token}`);
		}
	}

	private resetForm(formData: TransactionFormData): void {
		formData.form.reset({
			token: this.activeTokenData?.token || '',
			contractorId: null,
			storeId: null,
			passTypeId: null,
			startDate: this.formatDateToYYYYMMDD(new Date()),
			endDate: '',
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
}