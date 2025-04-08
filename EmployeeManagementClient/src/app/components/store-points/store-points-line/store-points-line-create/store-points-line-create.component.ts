import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-store-points-line-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './store-points-line-create.component.html',
	styleUrls: ['./store-points-line-create.component.css']
})
export class StorePointsLineCreateComponent {
	lineForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private storePointsService: StorePointsService,
		private router: Router
	) {
		// Инициализация формы с контролом и валидаторами
		this.lineForm = this.fb.group({
			lineName: ['', Validators.required]
		});
	}

	addLine(): void {
		this.errorMessage = ''; // Сброс ошибки перед началом

		if (this.lineForm.valid) {
			const lineName = this.lineForm.get('lineName')?.value.trim();

			if (lineName) {
				this.storePointsService.addLine(lineName).subscribe(
					() => {
						this.router.navigate(['/line']);
					},
					(error) => {
						if (error.status === 409) {
							this.errorMessage = 'Линия с таким именем уже существует. Пожалуйста, выберите другое имя.';
						} else {
							this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
						}
					}
				);
			} else {
				this.errorMessage = 'Название линии не может быть пустым.';
			}
		} else {
			this.errorMessage = 'Пожалуйста, заполните обязательные поля.';
		}
	}
}
