import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PositionService } from '../../../services/position.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
    selector: 'app-position-create',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule,
        MatIconModule,
        MatGridListModule,
        MatTooltipModule,
        TextFieldModule,
    ],
    templateUrl: './position-create.component.html',
    styleUrls: ['./position-create.component.css']
})
export class PositionCreateComponent {
	positionForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private positionService: PositionService,
		private router: Router
	) {
		this.positionForm = this.fb.group({
			positionName: ['', Validators.required]
		});
	}

	addPosition(): void {
		if (this.positionForm.valid) {
			const positionName = this.positionForm.value.positionName.trim();
			this.positionService.addPosition(positionName).subscribe(
				() => {
					this.router.navigate(['/positions']);
				},
				(error) => {
					if (error.status === 409) {
						this.errorMessage = 'Должность с таким именем уже существует. Пожалуйста, выберите другое имя.';
					} else {
						this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
					}
				}
			);
		} else {
			this.errorMessage = 'Пожалуйста, заполните обязательные поля.';
		}
	}

	cancel(): void {
		this.router.navigate(['/positions']);
	}
}
