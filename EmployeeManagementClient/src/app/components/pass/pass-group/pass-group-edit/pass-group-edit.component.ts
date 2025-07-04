import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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

@Component({
	selector: 'app-pass-group-edit',
	templateUrl: './pass-group-edit.component.html',
	styleUrls: ['./pass-group-edit.component.css'],
	standalone: true,
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
	]
})
export class PassGroupEditComponent implements OnInit {
	groupForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private service: PassGroupTypeService,
		private route: ActivatedRoute,
		private router: Router
	) {
		// Инициализация формы с контролами и валидаторами
		this.groupForm = this.fb.group({
			name: ['', Validators.required],
			color: ['#ffffff'], // Установим дефолтный цвет
		});
	}

	ngOnInit(): void {
		const id = +this.route.snapshot.params['id'];
		this.service.getGroupById(id).subscribe({
			next: (group) => {
				this.groupForm.patchValue({
					name: group.name,
					color: group.color || '#ffffff',
				});
			},
			error: (err) => {
				console.error('Ошибка при загрузке группы:', err);
				this.errorMessage = 'Произошла ошибка при загрузке группы. Попробуйте позже.';
			},
		});
	}

	updateGroup(): void {
		if (this.groupForm.valid) {
			const updatedGroup = {
				id: +this.route.snapshot.params['id'],
				...this.groupForm.value,
			};
			this.service.updateGroup(updatedGroup).subscribe({
				next: () => {
					console.log('Группа обновлена');
					this.router.navigate(['/pass-groups']); // Перенаправление на список групп
				},
				error: (err) => {
					console.error('Ошибка при обновлении группы:', err);
					this.errorMessage = 'Произошла ошибка при обновлении группы. Попробуйте позже.';
				},
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}

	cancel(): void {
		this.router.navigate(['/pass-groups']);
	}
}
