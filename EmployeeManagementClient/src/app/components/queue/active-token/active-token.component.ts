import { Component, OnInit } from '@angular/core';
import { QueueService } from '../../../services/queue.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-active-token',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './active-token.component.html',
	styleUrls: ['./active-token.component.css']
})
export class ActiveTokenComponent implements OnInit {
	activeToken: string | null = null;

	constructor(private queueService: QueueService, private router: Router) { }

	ngOnInit(): void {
		this.loadActiveToken();
	}

	/**
	 * Загрузка активного талона.
	 */
	loadActiveToken(): void {
		this.queueService.getActiveToken().subscribe({
			next: (data) => {
				this.activeToken = data.ActiveToken;
			},
			error: (err) => console.error('Ошибка при загрузке активного талона', err)
		});
	}

	/**
	 * Закрыть активный талон.
	 */
	closeToken(): void {
		if (this.activeToken) {
			this.queueService.closeToken(this.activeToken).subscribe({
				next: () => {
					this.activeToken = null;
					this.router.navigate(['/queue']); // Перенаправление после закрытия
				},
				error: (err) => console.error('Ошибка при закрытии талона', err)
			});
		}
	}

	/**
	 * Перейти к транзакции.
	 */
	goToTransaction(): void {
		if (this.activeToken) {
			// Предположим, что есть способ найти транзакцию по талону
			this.router.navigate(['/transactions'], { queryParams: { token: this.activeToken } });
		} else {
			alert('Нет активного талона для перехода к транзакции.');
		}
	}
}
