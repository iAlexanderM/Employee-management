import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService } from '../../services/queue.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-queue',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './queue.component.html',
	styleUrls: ['./queue.component.css'],
})
export class QueueComponent implements OnInit {

	// Классический подход
	currentToken: string = '';           // Например, "P2"
	newToken: string = '';               // Например, "P3"
	activeToken: string | null = null;   // Текущий активный
	pendingTokens: Array<{ token: string; createdAt: string }> = [];

	// JWT-подход
	signedToken: string = '';  // Если захотим показать, что мы взяли new-token/P в JWT-виде

	constructor(private queueService: QueueService, private router: Router) { }

	ngOnInit(): void {
		console.log('QueueComponent: ngOnInit...');
		// Загрузка текущего, активного и ожидающих талонов
		this.loadCurrentToken();
		this.loadActiveToken();
		this.loadPendingTokens();
	}

	//---------------------------------------
	// Классические методы
	//---------------------------------------

	/** (1) Запросить текущий талон (GET /api/Queue/current-token/P). */
	loadCurrentToken(): void {
		this.queueService.getCurrentToken('P').subscribe({
			next: (data) => {
				this.currentToken = data.currentToken;
				console.log('[Queue] currentToken:', this.currentToken);
			},
			error: (err) => console.error('[Queue] Ошибка getCurrentToken', err),
		});
	}

	/** (2) Создать новый талон (GET /api/Queue/new-token/P). */
	generateNewToken(): void {
		this.queueService.generateNewToken('P').subscribe({
			next: (data: { newToken: string }) => {
				this.newToken = data.newToken || '';
				console.log('[Queue] newToken:', this.newToken);

				// Обновить текущий талон и список ожидающих
				this.loadCurrentToken();
				this.loadPendingTokens();

				// Если новый талон создан, сразу активируем его
				if (this.newToken) {
					this.queueService.activateToken(this.newToken).subscribe({
						next: () => {
							console.log('[Queue] Талон сразу активирован:', this.newToken);
							this.loadActiveToken(); // теперь он становится activeToken
						},
						error: (err: any) => {
							console.error('[Queue] Ошибка автоактивации талона', err);
						},
					});
				}
			},
			error: (err: any) => {
				console.error('[Queue] Ошибка generateNewToken', err);
			},
		});
	}

	/** (3) Получить активный талон */
	loadActiveToken(): void {
		this.queueService.getActiveToken().subscribe({
			next: (data) => {
				this.activeToken = data.ActiveToken;
				console.log('[Queue] activeToken:', this.activeToken);
			},
			error: (err) => console.error('[Queue] Ошибка loadActiveToken', err),
		});
	}

	/** (4) Закрыть активный талон */
	closeActiveToken(): void {
		if (!this.activeToken) return;

		this.queueService.closeToken(this.activeToken).subscribe({
			next: () => {
				console.log('[Queue] Талон закрыт:', this.activeToken);
				this.activeToken = null;
				this.loadPendingTokens();
			},
			error: (err) => console.error('[Queue] Ошибка closeActiveToken', err),
		});
	}

	/** (5) Список Pending */
	loadPendingTokens(): void {
		this.queueService.getPendingTokens().subscribe({
			next: (data) => {
				this.pendingTokens = data;
				console.log('[Queue] pendingTokens:', data);
			},
			error: (err) => console.error('[Queue] Ошибка loadPendingTokens', err),
		});
	}

	/** (6) Активировать талон */
	activateToken(token: string): void {
		this.queueService.activateToken(token).subscribe({
			next: () => {
				console.log('[Queue] Талон активирован:', token);
				this.loadPendingTokens();
				this.loadActiveToken();
			},
			error: (err) => console.error('[Queue] Ошибка activateToken', err),
		});
	}

	//---------------------------------------
	// JWT-подход (пример использования)
	//---------------------------------------

	/** Получить signedToken (GET /api/Queue/new-token/P). */
	jwtGetNextSignedToken(): void {
		this.queueService.getNextSignedToken('P').subscribe({
			next: (resp) => {
				this.signedToken = resp.signedToken;
				console.log('[Queue][JWT] signedToken:', this.signedToken);
			},
			error: (err) => console.error('[Queue][JWT] Ошибка getNextSignedToken', err),
		});
	}

	/** Сохранить транзакцию через JWT-подход (POST /api/Queue/save-transaction). */
	jwtSaveTransaction(): void {
		// Пример. Обычно поля ContractorId / StoreId / PassTypeId берёте из формы.
		const dto = {
			signedToken: this.signedToken,
			contractorId: 123, // Замените на динамические значения
			storeId: 45,       // Замените на динамические значения
			passTypeId: 2,     // Замените на динамические значения
			startDate: '2025-01-01', // Замените на динамические значения
			endDate: '2025-01-31',   // Замените на динамические значения
			position: 'Продавец',     // Замените на динамические значения
		};

		this.queueService.saveTransaction(dto).subscribe({
			next: (resp) => {
				console.log('[Queue][JWT] saveTransaction ->', resp);
				alert('Транзакция успешно сохранена. Token: ' + resp.token);
				// Опционально: перенаправление или обновление данных
			},
			error: (err) => console.error('[Queue][JWT] Ошибка saveTransaction', err),
		});
	}
}
