// src/app/components/modals/active-token/active-token-floating.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService } from '../../../services/queue.service';
import { QueueToken } from '../../../models/queue.model';

@Component({
	selector: 'app-active-token-floating',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './active-token-floating.component.html',
	styleUrls: ['./active-token-floating.component.css']
})
export class ActiveTokenComponent {
	@Input() tokenData: QueueToken | null = null;
	@Output() close = new EventEmitter<void>();

	errorMessage = '';

	constructor(private queueService: QueueService) { }

	// При клике на "крестик" – если талон уже не Active, просто закрываем окно
	onCloseClick(): void {
		if (!this.tokenData) {
			this.close.emit();
			return;
		}
		if (this.tokenData.status === 'Active') {
			this.errorMessage = 'Нельзя закрыть окно, пока талон в статусе "Active".';
			return;
		}
		this.close.emit();
	}

	onCloseTokenOnServer(): void {
		if (!this.tokenData) return;
		if (this.tokenData.status !== 'Active') {
			this.errorMessage = 'Этот талон уже не Active.';
			return;
		}
		this.queueService.closeToken(this.tokenData.token).subscribe({
			next: (res) => {
				alert(res.message);
				// Если this.tokenData не null, обновляем статус локально
				if (this.tokenData) {
					this.tokenData.status = 'Closed';
				}
				// Эмитируем событие закрытия, чтобы родительский компонент обновил данные
				this.close.emit();
			},
			error: (err) => {
				console.error('Ошибка при закрытии талона:', err);
				this.errorMessage = 'Не удалось закрыть талон.';
			}
		});
	}
}
