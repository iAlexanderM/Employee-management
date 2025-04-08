import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PassGroupModalComponent } from '../../../modals/pass-group-modal/pass-group-modal.component';

@Component({
	selector: 'app-pass-type-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PassGroupModalComponent],
	templateUrl: './pass-type-create.component.html',
	styleUrls: ['./pass-type-create.component.css'],
})
export class PassTypeCreateComponent {
	passTypeForm: FormGroup;
	passGroupName: string = ''; // Для отображения названия группы
	isModalOpen: boolean = false;

	groupId!: number;
	groupName!: string;

	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private service: PassGroupTypeService,
		private router: Router,
		private route: ActivatedRoute
	) {
		// Инициализация формы с контролами и валидаторами
		this.passTypeForm = this.fb.group({
			name: ['', Validators.required],
			durationInMonths: [1, [Validators.required, Validators.min(1)]],
			cost: [0, [Validators.required, Validators.min(0)]],
			color: ['#ffffff'],
			passGroupId: [null, Validators.required],
			printTemplate: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]],
		});
	}

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			const id = +params['groupId'];
			const name = params['groupName'];

			if (!isNaN(id) && name) {
				this.groupId = id;
				this.groupName = name;
				this.passTypeForm.patchValue({
					passGroupId: id,
				});
				this.passGroupName = name;
			} else {
				console.error('Некорректные параметры groupId или groupName:', { id, name });
			}
		});
	}

	openGroupModal(): void {
		this.isModalOpen = true; // Открыть модальное окно
	}

	closeGroupModal(): void {
		this.isModalOpen = false; // Закрыть модальное окно
	}

	onGroupSelected(group: { id: number; name: string }): void {
		if (!group) {
			console.error('Группа не выбрана.');
			return;
		}

		this.passTypeForm.patchValue({
			passGroupId: group.id,
		});
		this.passGroupName = group.name;
		this.closeGroupModal();
	}

	createPassType(): void {
		if (this.passTypeForm.valid) {
			const newPassType: PassType = this.passTypeForm.value;
			this.service.createType(newPassType).subscribe({
				next: (createdPassType) => {
					// Если `sortOrder` равен 0, обновляем его на id
					if (!createdPassType.sortOrder) {
						createdPassType.sortOrder = createdPassType.id;
						this.service.updateType(createdPassType).subscribe({
							next: () => this.navigateToPassTypes(),
							error: (err) => {
								console.error('Ошибка при обновлении номера сортировки:', err);
								this.errorMessage = 'Ошибка при обновлении номера сортировки.';
							},
						});
					} else {
						this.navigateToPassTypes();
					}
				},
				error: (err) => {
					console.error('Ошибка при создании типа пропуска:', err);
					this.errorMessage = 'Ошибка при создании типа пропуска.';
				},
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}

	cancel(): void {
		this.navigateToPassTypes();
	}

	private navigateToPassTypes(): void {
		if (this.groupId && this.groupName) {
			// Если есть корректные параметры, идём на страницу pass-types c указанием группы
			this.router.navigate(['/pass-types'], {
				queryParams: { groupId: this.groupId, groupName: this.groupName },
			});
		} else {
			// Если нет корректных параметров, переходим на общий список групп
			console.warn('Данные группы отсутствуют или невалидны. Переходим на список групп.');
			this.router.navigate(['/pass-groups']);
		}
	}
}
