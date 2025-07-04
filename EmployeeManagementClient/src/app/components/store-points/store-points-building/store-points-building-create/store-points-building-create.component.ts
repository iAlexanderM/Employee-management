import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-store-points-building-create',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './store-points-building-create.component.html',
    styleUrls: ['./store-points-building-create.component.css']
})
export class StorePointsBuildingCreateComponent {
	buildingForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private storePointsService: StorePointsService,
		private router: Router
	) {
		// Инициализация формы с контролом и валидаторами
		this.buildingForm = this.fb.group({
			buildingName: ['', Validators.required],
		});
	}

	addBuilding(): void {
		this.errorMessage = ''; // Сброс ошибки перед началом

		if (this.buildingForm.valid) {
			const buildingName = this.buildingForm.get('buildingName')?.value.trim();

			if (buildingName) {
				this.storePointsService.addBuilding(buildingName).subscribe(
					() => {
						this.router.navigate(['/building']);
					},
					(error) => {
						if (error.status === 409) {
							this.errorMessage = 'Здание с таким именем уже существует. Пожалуйста, выберите другое имя.';
						} else {
							this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
						}
					}
				);
			} else {
				this.errorMessage = 'Название здания не может быть пустым.';
			}
		} else {
			this.errorMessage = 'Пожалуйста, заполните обязательные поля.';
		}
	}
}
