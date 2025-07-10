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
	selector: 'app-store-points-line-create',
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

	cancel(): void {
		this.router.navigate(['/line']);
	}
}