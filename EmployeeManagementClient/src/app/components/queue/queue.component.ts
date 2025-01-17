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
		// Подписываемся на SignalR событие, чтобы обновлять список при изменениях
		this.signalRService.onQueueUpdated(() => {
			console.log('QueueComponent: QueueUpdated event received – reloading tokens');
			this.loadTokens();
		});
	}

	loadTokens(): void {
		this.queueService.listAllTokens().subscribe({
			next: (data) => {
				this.tokens = data;
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
				// Можно обновить локальный список, но если SignalR пришёл, это обновит и его тоже
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
}
