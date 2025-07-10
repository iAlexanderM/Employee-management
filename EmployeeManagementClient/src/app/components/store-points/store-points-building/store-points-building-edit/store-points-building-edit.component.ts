import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Building } from '../../../../models/store-points.model';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-store-points-building-edit',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		MatGridListModule,
		MatTooltipModule
	],
	templateUrl: './store-points-building-edit.component.html',
	styleUrls: ['./store-points-building-edit.component.css']
})
export class StorePointsBuildingEditComponent implements OnInit {
	buildingForm: FormGroup;
	building: Building | null = null;
	errorMessage = '';

	constructor(
		private fb: FormBuilder,
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) {
		this.buildingForm = this.fb.group({
			buildingName: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]]
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		if (isNaN(id) || id <= 0) {
			this.errorMessage = 'Некорректный ID записи.';
			return;
		}

		this.storePointsService.getBuildingById(id).subscribe({
			next: (data) => {
				this.building = data;
				this.buildingForm.patchValue({
					buildingName: data.name,
					sortOrder: data.sortOrder ?? 0
				});
			},
			error: (error) => {
				this.errorMessage = error.message || 'Не удалось загрузить данные здания.';
			}
		});
	}

	updateBuilding(): void {
		this.errorMessage = '';
		if (this.buildingForm.valid && this.building) {
			const updatedBuildingName = this.buildingForm.get('buildingName')?.value.trim();
			const updatedSortOrder = this.buildingForm.get('sortOrder')?.value;

			this.storePointsService.updateBuilding(this.building.id!, updatedBuildingName, updatedSortOrder).subscribe({
				next: () => {
					this.router.navigate(['/building']);
				},
				error: (error) => {
					this.errorMessage = error.message || 'Произошла ошибка при обновлении здания.';
				}
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}

	cancel(): void {
		this.router.navigate(['/building']);
	}
}