import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { QueueService } from '../../services/queue.service';
import { QueueToken } from '../../models/queue.model';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { TransactionService } from '../../services/transaction.service';
import { SearchFilterResetService } from '../../services/search-filter-reset.service';
import { QueueSyncService } from '../../services/queue-sync.service';
import { jwtDecode } from 'jwt-decode';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface DecodedToken {
	sub?: string; // Обычно Subject ID (используется как User ID)
	nameid?: string; // Иногда User ID в этом claim
	unique_name?: string; // Иногда имя пользователя
	// другие свойства...
	exp?: number;
	iat?: number;
}


@Component({
    selector: 'app-queue',
    imports: [
        ReactiveFormsModule,
        CommonModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatGridListModule,
        MatTableModule,
        MatSelectModule,
        MatIconModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
    ],
    templateUrl: './queue.component.html',
    styleUrls: ['./queue.component.css']
})
export class QueueComponent implements OnInit { // Убрали OnDestroy т.к. SignalR не отписываем
	tokens: QueueToken[] = [];
	createTokenForm: FormGroup;
	currentPage = 1;
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];
	userMap: { [key: string]: string } = {};

	constructor(
		private queueService: QueueService,
		private fb: FormBuilder,
		private signalRService: SignalRService,
		private authService: AuthService, // AuthService остается
		private router: Router,
		private transactionService: TransactionService,
		private searchFilterResetService: SearchFilterResetService,
		private queueSyncService: QueueSyncService
	) {
		this.createTokenForm = this.fb.group({
			type: ['P', Validators.required]
		});
	}

	ngOnInit(): void {
		this.loadUsersFromTransactions();
		this.loadTokens();
		this.signalRService.onQueueUpdated(() => {
			console.log('QueueComponent: QueueUpdated event received – reloading tokens');
			this.loadTokens();
		});
	}

	// ngOnDestroy не нужен, если от SignalR не отписываемся здесь

	loadUsersFromTransactions(): void {
		this.transactionService.searchTransactions({}, 1, 100).subscribe({
			next: (result) => {
				this.userMap = {};
				result.transactions.forEach(t => {
					if (t.user && t.userId) {
						this.userMap[t.userId] = t.user.userName || 'Unknown';
					}
				});
			},
			error: (err) => console.error('Ошибка загрузки пользователей из транзакций:', err)
		});
	}

	loadTokens(): void {
		this.queueService.listAllTokens(this.currentPage, this.pageSize).subscribe({
			next: (result) => {
				this.totalItems = result.total;
				this.tokens = result.tokens;
				this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				this.updateVisiblePages();
				this.updateActiveTokenState(result.tokens); // Обновляем состояние в сервисе
			},
			error: (err) => {
				console.error('Ошибка при загрузке талонов:', err);
				this.tokens = [];
				this.totalItems = 0;
				this.totalPages = 0;
				this.queueSyncService.setActiveToken(''); // Очищаем токен в сервисе пустой строкой
			}
		});
	}

	private updateActiveTokenState(tokenList: QueueToken[]): void {
		const currentUserId = this.getCurrentUserIdFromToken(); // Получаем ID из токена

		if (!currentUserId) {
			console.log(`QueueComponent: Cannot determine current user ID from token.`);
			this.queueSyncService.setActiveToken(''); // Очищаем если ID нет
			return;
		}

		const activeForCurrentUser = tokenList.find(t => t.status === 'Active' && t.userId === currentUserId);

		if (activeForCurrentUser) {
			this.queueSyncService.setActiveToken(activeForCurrentUser.token); // Передаем строку токена
			console.log(`QueueComponent: Active token ${activeForCurrentUser.token} set in QueueSyncService.`);
		} else {
			this.queueSyncService.setActiveToken(''); // Очищаем токен пустой строкой
			console.log(`QueueComponent: No active token found for current user, cleared QueueSyncService.`);
		}
	}

	// Новый метод для получения ID пользователя из токена
	private getCurrentUserIdFromToken(): string | null {
		const token = this.authService.getToken(); // Получаем токен из AuthService
		if (!token) {
			return null;
		}
		try {
			const decodedToken: DecodedToken = jwtDecode(token);
			// Пытаемся получить ID из 'sub' или 'nameid'. Адаптируйте под ваш токен!
			const userId = decodedToken.sub || decodedToken.nameid;
			return userId || null;
		} catch (error) {
			console.error("Failed to decode token:", error);
			return null;
		}
	}

	getUserName(userId: string): string {
		return this.userMap[userId] || userId;
	}

	onCreateToken(): void {
		if (this.createTokenForm.invalid) return;
		const type = this.createTokenForm.value.type;
		this.queueService.createToken(type).subscribe({
			next: (res) => {
				alert(`Талон создан: ${res.token}`);
				this.createTokenForm.reset({ type: 'P' });
				this.router.navigate(['/passes/store-pass-search']);
			},
			error: (err) => {
				console.error('Ошибка при создании талона:', err);
				const errorMsg = err.error?.message || err.message || 'Не удалось создать талон.';
				alert(errorMsg);
			}
		});
	}

	onCloseToken(token: string): void {
		if (!confirm(`Вы уверены, что хотите закрыть талон ${token}?`)) return;
		this.queueService.closeToken(token).subscribe({
			next: (res) => {
				alert(res.message);
				this.searchFilterResetService.triggerReset();
				this.queueSyncService.setActiveToken('');
			},
			error: (err) => {
				console.error('Ошибка при закрытии талона:', err);
				alert('Не удалось закрыть талон.');
			}
		});
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const maxVisible = 7;

		if (this.totalPages <= maxVisible) {
			for (let i = 1; i <= this.totalPages; i++) pages.push(i);
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 6; i++) pages.push(i);
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) pages.push(i);
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