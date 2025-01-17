// src/app/components/queue/queue.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { QueueService } from '../../services/queue.service';
import { QueueToken } from '../../models/queue.model';
import { SignalRService } from '../../services/signalr.service';

@Component({
	selector: 'app-queue',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './queue.component.html',
	styleUrls: ['./queue.component.css']
})
export class QueueComponent implements OnInit {
	tokens: QueueToken[] = [];
	createTokenForm: FormGroup;

	// Пагинация
	currentPage = 1;
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];

	constructor(
		private queueService: QueueService,
		private fb: FormBuilder,
		private signalRService: SignalRService
	) {
		this.createTokenForm = this.fb.group({
			type: ['P', Validators.required]
		});
	}

	ngOnInit(): void {
		this.loadTokens();
		// Подписываемся на событие обновления через SignalR
		this.signalRService.onQueueUpdated(() => {
			console.log('QueueComponent: QueueUpdated event received – reloading tokens');
			this.loadTokens();
		});
	}

	loadTokens(): void {
		this.queueService.listAllTokens(this.currentPage, this.pageSize).subscribe({
			next: (result) => {
				this.totalItems = result.total;
				this.tokens = result.tokens;
				this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				this.updateVisiblePages();
			},
			error: (err) => {
				console.error('Ошибка при загрузке талонов:', err);
			}
		});
	}

	onCreateToken(): void {
		if (this.createTokenForm.invalid) {
			return;
		}
		const type = this.createTokenForm.value.type;
		this.queueService.createToken(type).subscribe({
			next: (res) => {
				alert(`Талон создан: ${res.token}`);
				this.createTokenForm.reset({ type: 'P' });
				this.loadTokens();
			},
			error: (err) => {
				console.error('Ошибка при создании талона:', err);
				alert('Не удалось создать талон.');
			}
		});
	}

	onCloseToken(token: string): void {
		if (!confirm(`Вы уверены, что хотите закрыть талон ${token}?`)) {
			return;
		}
		this.queueService.closeToken(token).subscribe({
			next: (res) => {
				alert(res.message);
				this.loadTokens();
			},
			error: (err) => {
				console.error('Ошибка при закрытии талона:', err);
				alert('Не удалось закрыть талон.');
			}
		});
	}

	// Пагинация: обновление видимых страниц
	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const maxVisible = 7;

		if (this.totalPages <= maxVisible) {
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 6; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(this.totalPages);
			}
		}
		this.visiblePages = pages;
	}

	onPageClick(page: number | string): void {
		if (page === '...') return;
		const pageNumber = page as number;
		if (pageNumber < 1 || pageNumber > this.totalPages) return;
		this.currentPage = pageNumber;
		this.loadTokens();
	}

	onPageSizeChange(event: any): void {
		this.pageSize = +event.target.value;
		this.currentPage = 1;
		this.loadTokens();
	}
}
