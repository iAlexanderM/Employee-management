import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Building } from '../../../../models/store-points.model';

@Component({
	selector: 'app-store-points-building-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './store-points-building-edit.component.html',
	styleUrls: ['./store-points-building-edit.component.css']
})
export class StorePointsBuildingEditComponent implements OnInit {
	buildingForm: FormGroup;
	building: Building | null = null;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) {
		// Инициализация формы с контролями и валидаторами
		this.buildingForm = this.fb.group({
			buildingName: ['', Validators.required],
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

		this.storePointsService.getBuildingById(id).subscribe({
			next: (data) => {
				this.building = data;
				this.buildingForm.patchValue({
					buildingName: data.name,
					sortOrder: data.sortOrder ?? 0,
				});
			},
			error: (error) => {
				console.error('Ошибка при загрузке здания:', error);
				this.errorMessage = 'Не удалось загрузить данные здания.';
			}
		});
	}

	updateBuilding(): void {
		this.errorMessage = ''; // Сброс ошибки

		if (this.buildingForm.valid && this.building) {
			const updatedBuildingName = this.buildingForm.get('buildingName')?.value.trim();
			const updatedSortOrder = this.buildingForm.get('sortOrder')?.value;

			this.storePointsService.updateBuilding(this.building.id!, updatedBuildingName, updatedSortOrder).subscribe({
				next: () => {
					this.router.navigate(['/building']);
				},
				error: (error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Здание с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении здания. Попробуйте снова.';
					}
				}
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}
}
