import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
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
    selector: 'app-pass-group-create',
    templateUrl: './pass-group-create.component.html',
    styleUrls: ['./pass-group-create.component.css'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
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
    ]
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
