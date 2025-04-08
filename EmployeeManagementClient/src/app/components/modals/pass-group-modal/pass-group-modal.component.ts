import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassGroupTypeService } from '../../../services/pass-group-type.service'

@Component({
	selector: 'app-pass-group-modal',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './pass-group-modal.component.html',
	styleUrls: ['./pass-group-modal.component.css'],
})
export class PassGroupModalComponent {
	@Output() modalClose = new EventEmitter<void>();
	@Output() groupSelected = new EventEmitter<any>();
	groups: any[] = [];
	errorMessage: string = '';

	constructor(private service: PassGroupTypeService) { }

	ngOnInit(): void {
		this.loadGroups();
	}

	loadGroups(): void {
		this.service.getGroups().subscribe({
			next: (data) => (this.groups = data),
			error: (err) => {
				console.error('Ошибка при загрузке групп пропусков:', err);
				this.errorMessage = 'Не удалось загрузить группы пропусков.';
			},
		});
	}

	selectGroup(group: any): void {
		this.groupSelected.emit(group);
		this.closeModal();
	}

	closeModal(): void {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}
}
