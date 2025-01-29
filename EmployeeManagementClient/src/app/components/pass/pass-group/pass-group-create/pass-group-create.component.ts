import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';

@Component({
	selector: 'app-pass-group-create',
	templateUrl: './pass-group-create.component.html',
	styleUrls: ['./pass-group-create.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class PassGroupCreateComponent {
	groupForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private service: PassGroupTypeService,
		private router: Router
	) {
		// Инициализация формы с контролами и валидаторами
		this.groupForm = this.fb.group({
			name: ['', Validators.required],
			color: ['#ffffff'], // Установим дефолтный цвет
		});
	}

	createGroup(): void {
		if (this.groupForm.valid) {
			const newGroup = this.groupForm.value;
			this.service.createGroup(newGroup).subscribe({
				next: () => {
					console.log('Группа создана');
					this.router.navigate(['/pass-groups']); // Перенаправляем на список групп
				},
				error: (err) => {
					console.error('Ошибка при создании группы:', err);
					this.errorMessage = 'Произошла ошибка при создании группы. Попробуйте позже.';
				},
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}
}
