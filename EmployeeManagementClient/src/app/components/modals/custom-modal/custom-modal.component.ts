import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-custom-modal',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './custom-modal.component.html',
	styleUrls: ['./custom-modal.component.css'],
})
export class CustomModalComponent {
	@Input() title: string = 'Модальное окно';
	@Output() modalClose = new EventEmitter<void>();

	closeModal(): void {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}
}
