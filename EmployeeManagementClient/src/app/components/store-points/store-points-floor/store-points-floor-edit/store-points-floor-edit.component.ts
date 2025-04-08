import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Floor } from '../../../../models/store-points.model';

@Component({
	selector: 'app-store-points-floor-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './store-points-floor-edit.component.html',
	styleUrls: ['./store-points-floor-edit.component.css']
})
export class StorePointsFloorEditComponent implements OnInit {
	floorForm: FormGroup;
	floor: Floor | null = null;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) {
		// Инициализация формы с контролями и валидаторами
		this.floorForm = this.fb.group({
			floorName: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]],
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		if (isNaN(id) || id <= 0) {
			console.error('Некорректный ID');
			this.errorMessage = 'Некорректный ID записи.';
			return;
		}

		this.storePointsService.getFloorById(id).subscribe({
			next: (data) => {
				this.floor = data;
				this.floorForm.patchValue({
					floorName: data.name,
					sortOrder: data.sortOrder ?? 0,
				});
			},
			error: (error) => {
				console.error('Ошибка при загрузке этажа:', error);
				this.errorMessage = 'Не удалось загрузить данные этажа.';
			}
		});
	}

	updateFloor(): void {
		this.errorMessage = ''; // Сброс ошибки

		if (this.floorForm.valid && this.floor) {
			const updatedFloorName = this.floorForm.get('floorName')?.value.trim();
			const updatedSortOrder = this.floorForm.get('sortOrder')?.value;

			this.storePointsService.updateFloor(this.floor.id!, updatedFloorName, updatedSortOrder).subscribe({
				next: () => {
					this.router.navigate(['/floor']);
				},
				error: (error) => {
					console.error('Full error object:', error);
					console.error('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Этаж с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении этажа. Попробуйте снова.';
					}
				}
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}
}
