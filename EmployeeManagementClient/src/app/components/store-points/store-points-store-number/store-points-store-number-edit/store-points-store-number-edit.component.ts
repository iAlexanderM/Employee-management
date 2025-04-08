import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { StoreNumber } from '../../../../models/store-points.model';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators
} from '@angular/forms';

@Component({
	selector: 'app-store-points-store-number-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './store-points-store-number-edit.component.html',
	styleUrls: ['./store-points-store-number-edit.component.css']
})
export class StorePointsStoreNumberEditComponent implements OnInit {
	storeNumber: StoreNumber | null = null;

	// Reactive Form
	storeNumberForm: FormGroup;

	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService,
		private fb: FormBuilder
	) {
		// Инициализируем форму
		this.storeNumberForm = this.fb.group({
			name: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]]
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.storePointsService.getStoreNumberById(id).subscribe((data) => {
			this.storeNumber = data;

			// Заполняем форму данными, полученными с бэкенда
			this.storeNumberForm.patchValue({
				name: data.name,
				sortOrder: data.sortOrder ?? 0
			});
		});
	}

	updateStoreNumber(): void {
		// Если storeNumber ещё не загрузился, выходим
		if (!this.storeNumber) return;

		// Если форма невалидна — выводим ошибку (опционально)
		if (this.storeNumberForm.invalid) {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
			return;
		}

		// Извлекаем значения из формы
		const formValue = this.storeNumberForm.value;
		const updatedName = (formValue.name || '').trim();
		const updatedSortOrder = Number(formValue.sortOrder);

		// Если данные пустые/невалидные
		if (!updatedName || isNaN(updatedSortOrder)) {
			this.errorMessage = 'Поле «Название» не должно быть пустым, а сортировка — числом.';
			return;
		}

		// Отправляем запрос на обновление
		this.storePointsService
			.updateStoreNumber(this.storeNumber.id!, updatedName, updatedSortOrder)
			.subscribe(
				() => {
					// При успехе возвращаемся на список
					this.router.navigate(['/storeNumber']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage =
							'Торговая точка с таким именем или сортировкой уже существует. ' +
							'Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении. Попробуйте снова.';
					}
				}
			);
	}
}
