import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PassGroupModalComponent } from '../../../modals/pass-group-modal/pass-group-modal.component';

@Component({
	selector: 'app-pass-type-edit',
	standalone: true,
	imports: [CommonModule, FormsModule, PassGroupModalComponent],
	templateUrl: './pass-type-edit.component.html',
	styleUrls: ['./pass-type-edit.component.css'],
})
export class PassTypeEditComponent implements OnInit {
	passType: PassType = {
		id: 0,
		name: '',
		durationInMonths: 1,
		cost: 0,
		color: '#000000',
		passGroupId: 1,
		printTemplate: '',
		isArchived: false,
		sortOrder: 0,
	};

	passGroupName: string = '';
	isModalOpen: boolean = false;

	constructor(
		private service: PassGroupTypeService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.params['id']);
		if (!id) {
			console.error('Некорректный ID');
			return;
		}
		this.service.getTypeById(id).subscribe({
			next: (data) => {
				this.passType = data;
				this.loadGroupName();
			},
			error: (err) => console.error('Ошибка при загрузке типа пропуска:', err),
		});
	}

	loadGroupName(): void {
		if (this.passType.passGroupId) {
			this.service.getGroupById(this.passType.passGroupId).subscribe({
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

	onGroupSelected(group: any): void {
		this.passType.passGroupId = group.id;
		this.passGroupName = group.name;
		this.isModalOpen = false;
	}

	updatePassType(): void {
		if (
			!this.passType.name ||
			!this.passType.durationInMonths ||
			this.passType.cost === undefined ||
			!this.passType.printTemplate ||
			this.passType.sortOrder === undefined
		) {
			alert('Все поля обязательны для заполнения.');
			return;
		}

		this.service.updateType(this.passType).subscribe({
			next: () =>
				this.router.navigate(['/pass-groups'], {
					queryParams: {
						groupId: this.passType.passGroupId,
						groupName: this.passGroupName,
					},
				}),
			error: (err) => console.error('Ошибка при обновлении типа пропуска:', err),
		});
	}
}