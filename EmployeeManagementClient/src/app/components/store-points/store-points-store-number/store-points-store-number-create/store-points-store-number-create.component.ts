import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-store-points-store-number-create',
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
	templateUrl: './store-points-store-number-create.component.html',
	styleUrls: ['./store-points-store-number-create.component.css']
})
export class StorePointsStoreNumberCreateComponent {
	storeNumberForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private storePointsService: StorePointsService,
		private router: Router,
		private fb: FormBuilder
	) {
		this.storeNumberForm = this.fb.group({
			name: ['', Validators.required]
		});
	}

	addStoreNumber(): void {
		this.errorMessage = ''; // Clear previous errors

		if (this.storeNumberForm.invalid) {
			this.errorMessage = 'Название точки не может быть пустым.';
			return;
		}

		const rawName = this.storeNumberForm.value.name;
		const trimmedName = (rawName || '').trim();

		if (!trimmedName) {
			this.errorMessage = 'Название точки не может быть пустым.';
			return;
		}

		this.storePointsService.addStoreNumber(trimmedName).subscribe(
			() => {
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

	cancel(): void {
		this.router.navigate(['/storeNumber']);
	}
}