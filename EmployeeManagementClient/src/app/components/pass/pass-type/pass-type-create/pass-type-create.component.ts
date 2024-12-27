import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PassGroupModalComponent } from '../../../modals/pass-group-modal/pass-group-modal.component';

@Component({
	selector: 'app-pass-type-create',
	standalone: true,
	imports: [CommonModule, FormsModule, PassGroupModalComponent],
	templateUrl: './pass-type-create.component.html',
	styleUrls: ['./pass-type-create.component.css'],
})
export class PassTypeCreateComponent {
	passType: Partial<PassType> = {
		name: '',
		durationInMonths: 1,
		cost: 0,
		color: '#ffffff',
		passGroupId: undefined,
		printTemplate: '',
		sortOrder: 0,
	};

	passGroupName: string = ''; // Для отображения названия группы
	isModalOpen: boolean = false;

	groupId!: number;
	groupName!: string;

	constructor(
		private service: PassGroupTypeService,
		private router: Router,
		private route: ActivatedRoute
	) { }

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			const id = +params['groupId'];
			const name = params['groupName'];

			if (!isNaN(id) && name) {
				this.groupId = id;
				this.groupName = name;
				this.passType.passGroupId = id;
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

		this.passType.passGroupId = group.id; // Установить ID группы
		this.passGroupName = group.name; // Установить название группы
		this.closeGroupModal();
	}

	createPassType(): void {
		if (
			!this.passType.name ||
			!this.passType.durationInMonths ||
			this.passType.cost === undefined ||
			!this.passType.passGroupId
		) {
			alert('Все поля обязательны для заполнения.');
			return;
		}

		this.service.createType(this.passType as PassType).subscribe({
			next: (createdPassType) => {
				// Если `sortOrder` равен 0, обновляем его на id
				if (!this.passType.sortOrder) {
					createdPassType.sortOrder = createdPassType.id;
					this.service.updateType(createdPassType).subscribe({
						next: () => this.navigateToPassTypes(),
						error: (err) => console.error('Ошибка при обновлении номера сортировки:', err),
					});
				} else {
					this.navigateToPassTypes();
				}
			},
			error: (err) => console.error('Ошибка при создании типа пропуска:', err),
		});
	}

	cancel(): void {
		this.navigateToPassTypes();
	}

	private navigateToPassTypes(): void {
		if (this.groupId && this.groupName) {
			this.router.navigate(['/pass-types'], {
				queryParams: { groupId: this.groupId, groupName: this.groupName },
			});
		} else {
			console.error('Данные группы отсутствуют. Переход невозможен.');
			this.router.navigate(['/pass-types']);
		}
	}
}
