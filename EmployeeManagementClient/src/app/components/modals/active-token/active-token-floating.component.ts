import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QueueService } from '../../../services/queue.service';
import { QueueToken } from '../../../models/queue.model';
import { SearchFilterResetService } from '../../../services/search-filter-reset.service';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-active-token-floating',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatCardModule,
		MatIconModule,
		DragDropModule,
		MatTooltipModule,
		RouterModule
	],
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

	navigateToSearch(): void {
		this.router.navigate(['/passes/store-pass-search']);
	}

	navigateToCreateTransaction(): void {
		this.router.navigate(['/transactions/create']);
	}
}