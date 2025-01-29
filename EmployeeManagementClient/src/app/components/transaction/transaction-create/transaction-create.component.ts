import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	FormControl,
	Validators,
	ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';

import { TransactionService } from '../../../services/transaction.service';
// Модальное окно или другие сервисы (для выбора Contractor / Store / PassType)
import { Contractor } from '../../../models/contractor.model';
import { Store } from '../../../models/store.model';
import { PassType } from '../../../models/pass-type.model';

@Component({
	selector: 'app-transaction-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './transaction-create.component.html',
	styleUrls: ['./transaction-create.component.css']
})
export class TransactionCreateComponent implements OnInit {
	transactionForm!: FormGroup;
	errorMessage: string = '';

	// Показ отображаемых "имен" (read-only) для выбранных сущностей
	selectedContractorName: string = '';
	selectedStoreName: string = '';
	selectedPassTypeName: string = '';

	// Допустим, вы где-то подгружаете список passTypes (с сервера / из Modal)
	passTypes: PassType[] = [];

	constructor(
		private fb: FormBuilder,
		private transactionService: TransactionService,
		private router: Router
	) { }

	ngOnInit(): void {
		// Создаём форму
		this.transactionForm = this.fb.group({
			// read-only (disabled) поле token
			token: [{ value: '', disabled: true }, Validators.required],

			contractorId: [null, Validators.required],
			storeId: [null, Validators.required],
			passTypeId: [null, Validators.required],

			// Дата начала (по умолчанию сегодня)
			startDate: [this.formatDateToYYYYMMDD(new Date()), Validators.required],

			// Дата окончания (read-only)
			endDate: [{ value: '', disabled: true }, Validators.required],

			position: ['', Validators.required]
		});

		// Пример: автоподстановка token
		this.transactionForm.patchValue({
			token: 'TALON-12345'
		});

		// Подписка на изменения startDate или passTypeId => пересчитываем endDate
		this.initAutoEndDateCalc();
	}

	/**
	 * Метод для отправки формы (создание транзакции).
	 */
	createTransaction(): void {
		if (this.transactionForm.invalid) {
			this.errorMessage = 'Некоторые поля не заполнены или невалидны.';
			return;
		}

		// disabled поля не попадут в .value, поэтому используем getRawValue()
		const formValue = this.transactionForm.getRawValue();
		// formValue = { token, contractorId, storeId, passTypeId, startDate, endDate, position }

		this.transactionService.createTransaction(formValue).subscribe({
			next: () => {
				this.router.navigate(['/transactions']);
			},
			error: (err) => {
				console.error('[createTransaction] Ошибка:', err);
				this.errorMessage = 'Ошибка при создании транзакции.';
			}
		});
	}

	// ===== Работа с контрагентом (модальное окно) =====
	openContractorModal(): void {
		// тут вызываем окно, где пользователь выбирает Contractor
		// по итогу: this.contractorSelected(contractor.id, contractor.fullName);
	}
	contractorSelected(id: number, displayName: string): void {
		this.transactionForm.patchValue({ contractorId: id });
		this.selectedContractorName = displayName;
	}

	// ===== Работа с торговой точкой (модальное окно) =====
	openStoreModal(): void {
		// аналогично
	}
	storeSelected(id: number, displayName: string): void {
		this.transactionForm.patchValue({ storeId: id });
		this.selectedStoreName = displayName;
	}

	// ===== Работа с типом пропуска (модальное окно) =====
	openPassTypeModal(): void {
		// откроем окно, пользователь выбрал passType
	}
	passTypeSelected(passType: PassType): void {
		// Устанавливаем ID
		this.transactionForm.patchValue({ passTypeId: passType.id });
		// Пишем имя для отображения
		this.selectedPassTypeName = passType.name;

		// При желании сразу пересчитать endDate
		this.autoCalculateEndDate();
	}

	/**
	 * Подписываемся на изменения startDate и passTypeId => autoCalculateEndDate()
	 */
	private initAutoEndDateCalc(): void {
		const startDateCtrl = this.transactionForm.get('startDate');
		const passTypeIdCtrl = this.transactionForm.get('passTypeId');

		startDateCtrl?.valueChanges.subscribe(() => {
			this.autoCalculateEndDate();
		});
		passTypeIdCtrl?.valueChanges.subscribe(() => {
			this.autoCalculateEndDate();
		});
	}

	/**
	 * Вычисляем endDate = startDate + passType.durationInMonths (если есть).
	 * Так как модель PassType содержит много полей, нужно найти реальный passType.
	 */
	private autoCalculateEndDate(): void {
		const startDate = this.transactionForm.get('startDate')?.value;
		const passTypeId = this.transactionForm.get('passTypeId')?.value;
		const endDateCtrl = this.transactionForm.get('endDate');

		if (!startDate || !passTypeId || !endDateCtrl) return;

		// Найдем реальный passType в массиве passTypes (или где-то храните)
		const passType = this.passTypes.find((pt) => pt.id === passTypeId);
		if (!passType) return;

		// durationInMonths
		const months = passType.durationInMonths || 0;

		// Преобразуем startDate (string "YYYY-MM-DD") в Date
		const start = this.parseDate(startDate);
		// Прибавляем months
		const end = this.addMonths(start, months);

		// Заполняем endDate (disabled поле)
		endDateCtrl.patchValue(this.formatDateToYYYYMMDD(end), { emitEvent: false });
	}

	// ====== Утилиты для дат ======
	private parseDate(str: string): Date {
		// "2023-02-15" => Date
		const [yyyy, mm, dd] = str.split('-').map(x => parseInt(x, 10));
		return new Date(yyyy, mm - 1, dd);
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
}
