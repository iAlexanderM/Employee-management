import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-store-points-floor-create',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './store-points-floor-create.component.html',
    styleUrls: ['./store-points-floor-create.component.css']
})
export class StorePointsFloorCreateComponent {
	floorForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private storePointsService: StorePointsService,
		private router: Router
	) {
		// Инициализация формы с контролом и валидаторами
		this.floorForm = this.fb.group({
			floorName: ['', Validators.required]
		});
	}

	addFloor(): void {
		this.errorMessage = ''; // Сброс ошибки перед началом

		if (this.floorForm.valid) {
			const floorName = this.floorForm.get('floorName')?.value.trim();

			if (floorName) {
				this.storePointsService.addFloor(floorName).subscribe(
					() => {
						this.router.navigate(['/floor']);
					},
					(error) => {
						if (error.status === 409) {
							this.errorMessage = 'Этаж с таким именем уже существует. Пожалуйста, выберите другое имя.';
						} else {
							this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
						}
					}
				);
			} else {
				this.errorMessage = 'Название этажа не может быть пустым.';
			}
		} else {
			this.errorMessage = 'Пожалуйста, заполните обязательные поля.';
		}
	}
}
