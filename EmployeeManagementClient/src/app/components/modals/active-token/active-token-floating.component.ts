// src/app/components/modals/active-token/active-token-floating.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SearchFilterResetService } from '../../../services/search-filter-reset.service';
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

	constructor(
		private queueService: QueueService,
		private router: Router,
		private searchFilterResetService: SearchFilterResetService
	) { }

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
		this.errorMessage = '';

		this.queueService.closeToken(this.tokenData.token).subscribe({
			next: (res) => {
				console.log('Талон успешно закрыт на сервере:', res.message);
				this.searchFilterResetService.triggerReset();
				this.router.navigate(['/queue']);
				this.close.emit();
			},
			error: (err) => {
				console.error('Ошибка при закрытии талона:', err);
				this.errorMessage = 'Не удалось закрыть талон.';
			}
		});
	}
}
