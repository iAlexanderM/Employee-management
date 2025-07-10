import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { StoreNumber } from '../../../../models/store-points.model';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-store-points-store-number-edit',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatCardModule,
		MatButtonModule,
		MatInputModule,
		MatFormFieldModule,
		MatIconModule,
		MatGridListModule,
		MatTooltipModule
	],
	templateUrl: './store-points-store-number-edit.component.html',
	styleUrls: ['./store-points-store-number-edit.component.css']
})
export class StorePointsStoreNumberEditComponent implements OnInit {
	storeNumberForm: FormGroup;
	storeNumber: StoreNumber | null = null;
	errorMessage = '';

	constructor(
		private fb: FormBuilder,
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) {
		this.storeNumberForm = this.fb.group({
			storeNumberName: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]]
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		if (isNaN(id) || id <= 0) {
			this.errorMessage = 'Некорректный ID записи.';
			return;
		}

		this.storePointsService.getStoreNumberById(id).subscribe({
			next: (data) => {
				this.storeNumber = data;
				this.storeNumberForm.patchValue({
					storeNumberName: data.name,
					sortOrder: data.sortOrder ?? 0
				});
			},
			error: (error) => {
				this.errorMessage = error.message || 'Не удалось загрузить данные store-number.';
			}
		});
	}

	updateStoreNumber(): void {
		this.errorMessage = '';
		if (this.storeNumberForm.valid && this.storeNumber) {
			const updatedStoreNumberName = this.storeNumberForm.get('storeNumberName')?.value.trim();
			const updatedSortOrder = this.storeNumberForm.get('sortOrder')?.value;

			this.storePointsService.updateStoreNumber(this.storeNumber.id!, updatedStoreNumberName, updatedSortOrder).subscribe({
				next: () => {
					this.router.navigate(['/store-number']);
				},
				error: (error) => {
					this.errorMessage = error.message || 'Произошла ошибка при обновлении store-number.';
				}
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}

	cancel(): void {
		this.router.navigate(['/store-number']);
	}
}