import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PassGroupModalComponent } from '../../../modals/pass-group-modal/pass-group-modal.component';

@Component({
	selector: 'app-pass-type-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PassGroupModalComponent],
	templateUrl: './pass-type-edit.component.html',
	styleUrls: ['./pass-type-edit.component.css'],
})
export class PassTypeEditComponent implements OnInit {
	passTypeForm: FormGroup;
	passGroupName: string = '';
	isModalOpen: boolean = false;

	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private service: PassGroupTypeService,
		private route: ActivatedRoute,
		private router: Router
	) {
		// Инициализация формы с контролами и валидаторами
		this.passTypeForm = this.fb.group({
			name: ['', Validators.required],
			durationInMonths: [1, [Validators.required, Validators.min(1)]],
			cost: [0, [Validators.required, Validators.min(0)]],
			color: ['#000000'],
			passGroupId: [null, Validators.required],
			printTemplate: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]],
			isArchived: [false],
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.params['id']);
		if (!id) {
			console.error('Некорректный ID');
			this.errorMessage = 'Некорректный ID типа пропуска.';
			return;
		}
		this.service.getTypeById(id).subscribe({
			next: (data) => {
				this.passTypeForm.patchValue({
					name: data.name,
					durationInMonths: data.durationInMonths,
					cost: data.cost,
					color: data.color || '#000000',
					passGroupId: data.passGroupId,
					printTemplate: data.printTemplate,
					sortOrder: data.sortOrder,
					isArchived: data.isArchived,
				});
				this.loadGroupName(data.passGroupId);
			},
			error: (err) => {
				console.error('Ошибка при загрузке типа пропуска:', err);
				this.errorMessage = 'Ошибка при загрузке типа пропуска.';
			},
		});
	}

	loadGroupName(passGroupId: number): void {
		if (passGroupId) {
			this.service.getGroupById(passGroupId).subscribe({
				next: (group) => (this.passGroupName = group.name),
				error: (err) => console.error('Ошибка при загрузке названия группы:', err),
			});
		}
	}

	openGroupModal(): void {
		this.isModalOpen = true;
	}

	closeGroupModal(): void {
		this.isModalOpen = false;
	}

	onGroupSelected(group: { id: number; name: string }): void {
		this.passTypeForm.patchValue({
			passGroupId: group.id,
		});
		this.passGroupName = group.name;
		this.isModalOpen = false;
	}

	updatePassType(): void {
		if (this.passTypeForm.valid) {
			const updatedPassType: PassType = {
				id: Number(this.route.snapshot.params['id']),
				...this.passTypeForm.value,
			};
			this.service.updateType(updatedPassType).subscribe({
				next: () =>
					this.router.navigate(['/pass-groups'], {
						queryParams: {
							groupId: updatedPassType.passGroupId,
							groupName: this.passGroupName,
						},
					}),
				error: (err) => {
					console.error('Ошибка при обновлении типа пропуска:', err);
					this.errorMessage = 'Ошибка при обновлении типа пропуска.';
				},
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}
}
