import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Line } from '../../../../models/store-points.model';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	Validators
} from '@angular/forms';

@Component({
    selector: 'app-store-points-line-edit',
    imports: [CommonModule, ReactiveFormsModule], // убираем FormsModule, добавляем ReactiveFormsModule
    templateUrl: './store-points-line-edit.component.html',
    styleUrls: ['./store-points-line-edit.component.css']
})
export class StorePointsLineEditComponent implements OnInit {
	line: Line | null = null;
	lineForm: FormGroup;        // Форма для редактирования
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService,
		private fb: FormBuilder
	) {
		// Создаём форму. Можно добавить и другие валидаторы
		this.lineForm = this.fb.group({
			name: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]]
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		if (isNaN(id) || id <= 0) {
			this.errorMessage = 'Некорректный ID записи.';
			return;
		}
		this.storePointsService.getLineById(id).subscribe(data => {
			this.line = data;

			// Проставляем исходные значения в форму
			this.lineForm.patchValue({
				name: data.name,
				sortOrder: data.sortOrder ?? 0
			});
		});
	}

	updateLine(): void {
		if (!this.line) return;  // если по какой-то причине line ещё не загрузился
		this.errorMessage = '';

		if (this.lineForm.invalid) {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
			return;
		}

		// Получаем значения из формы
		const formValue = this.lineForm.value;
		const updatedName = (formValue.name || '').trim();
		const updatedSortOrder = Number(formValue.sortOrder);

		// Проверяем, что имя непустое и sortOrder не null
		if (!updatedName || isNaN(updatedSortOrder)) {
			this.errorMessage = 'Поля не должны быть пустыми или невалидными.';
			return;
		}

		this.storePointsService.updateLine(this.line.id!, updatedName, updatedSortOrder).subscribe(
			() => {
				// Если всё ок, переходим назад на список
				this.router.navigate(['/line']);
			},
			(error) => {
				console.log('Full error object:', error);
				console.log('Error status:', error?.status);

				if (error?.status === 409) {
					this.errorMessage = 'Линия с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
				} else {
					this.errorMessage = 'Произошла ошибка при обновлении линии. Попробуйте снова.';
				}
			}
		);
	}
}
