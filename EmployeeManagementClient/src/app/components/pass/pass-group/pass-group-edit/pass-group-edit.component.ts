import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';

@Component({
	selector: 'app-pass-group-edit',
	templateUrl: './pass-group-edit.component.html',
	styleUrls: ['./pass-group-edit.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
}
