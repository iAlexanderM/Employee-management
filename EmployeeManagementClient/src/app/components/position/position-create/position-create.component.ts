import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PositionService } from '../../../services/position.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-position-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
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
}
