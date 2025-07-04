import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-store-points-store-number-create',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './store-points-store-number-create.component.html',
    styleUrls: ['./store-points-store-number-create.component.css']
})
export class StorePointsStoreNumberCreateComponent {
	// Убираем newStoreNumberName: string
	// Вместо этого — FormGroup (или FormControl).
	storeNumberForm: FormGroup;

	errorMessage: string = '';

	constructor(
		private storePointsService: StorePointsService,
		private router: Router,
		private fb: FormBuilder
	) {
		// Создаём форму. Можно добавить валидаторы, например required.
		this.storeNumberForm = this.fb.group({
			name: ['', Validators.required]
		});
	}

	addStoreNumber(): void {
		// Если форма невалидна — показываем ошибку (опционально).
		if (this.storeNumberForm.invalid) {
			this.errorMessage = 'Название точки не может быть пустым.';
			return;
		}

		// Считываем значение из формы
		const rawName = this.storeNumberForm.value.name;
		const trimmedName = (rawName || '').trim();
		if (!trimmedName) {
			this.errorMessage = 'Название точки не может быть пустым.';
			return;
		}

		// Вызываем сервис для создания
		this.storePointsService.addStoreNumber(trimmedName).subscribe(
			() => {
				// При успехе — переходим на список
				this.router.navigate(['/storeNumber']);
			},
			(error) => {
				if (error.status === 409) {
					this.errorMessage = 'Точка с таким именем уже существует. Пожалуйста, выберите другое имя.';
				} else {
					this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
				}
			}
		);
	}
}
