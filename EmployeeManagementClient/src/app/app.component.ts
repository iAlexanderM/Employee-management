import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { AuthService } from './services/auth.service';
import { QueueService } from './services/queue.service';
import { SignalRService } from './services/signalr.service';
import { ActiveTokenComponent } from './components/modals/active-token/active-token-floating.component';
import { QueueToken } from './models/queue.model';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterModule, ActiveTokenComponent],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
	isReferencesExpanded = false;
	isTransactionsExpanded = false;
	title = 'Employee Management';
	private inactivityListeners: (() => void)[] = [];
	private authSubscription: Subscription | null = null;
	private activeTokenCheckSubscription: Subscription | null = null;
	private routerEventsSubscription: Subscription | null = null;

	// Плавающая панель активного талона
	showActivePanel = false;
	activeToken: QueueToken | null = null;

	constructor(
		private authService: AuthService,
		private queueService: QueueService,
		private signalRService: SignalRService,
		private router: Router
	) {
		this.setupInactivityListeners();

		// При инициализации проверяем авторизацию
		this.authSubscription = this.authService.initializeToken().subscribe(isAuthenticated => {
			if (!isAuthenticated) {
				console.warn('Пользователь не авторизован. -> /login');
				this.router.navigate(['/login']);
			} else {
				console.log('Пользователь авторизован. Запускаем SignalR.');
				this.startSignalR();
				// Если на /login, сразу перенаправляем на основной роут (например, dashboard)
				if (this.router.url === '/login') {
					this.router.navigate(['/dashboard']);
				}
				// Можно не вызывать loadActiveToken сразу, а отложить его до конца навигации
			}
		});

		// Подписка на событие проверки активного талона из AuthService
		this.activeTokenCheckSubscription = this.authService.activeTokenCheck$.subscribe(() => {
			console.log('Событие activeTokenCheck получено. Вызывается метод loadActiveToken().');
			this.loadActiveToken(() => {
				console.log('Метод loadActiveToken() успешно выполнен после события activeTokenCheck.');
			});
		});
	}

	ngOnInit(): void {
		// Подписка на события роутера для определения момента завершения навигации
		this.routerEventsSubscription = this.router.events
			.pipe(filter(event => event instanceof NavigationEnd))
			.subscribe(() => {
				// Если пользователь авторизован и мы не на странице логина – загружаем активный талон
				if (this.isAuthenticated() && this.router.url !== '/login') {
					console.log('Навигация завершена. Вызывается метод loadActiveToken().');
					this.loadActiveToken(() => {
						console.log('Метод loadActiveToken() успешно выполнен после навигации.');
					});
				}
			});
	}

	/**
	 * Запуск SignalR, только если пользователь авторизован.
	 */
	private startSignalR(): void {
		this.signalRService.startConnection()
			.then(() => {
				console.log('SignalR: startConnection success.');
				// Подписываемся на событие обновления очереди.
				this.signalRService.onQueueUpdated(() => {
					console.log('SignalR: "QueueUpdated" получено. Вызывается метод loadActiveToken().');
					this.loadActiveToken(() => {
						console.log('Метод loadActiveToken() успешно выполнен после события QueueUpdated.');
					});
				});
			})
			.catch(err => {
				console.error('SignalR start error:', err);
			});
	}

	/**
	 * Загружает активный талон и обновляет состояние панели.
	 * Если активный талон найден, выводит в консоль "Активный талон: <token>".
	 * @param callback Опциональная функция, вызываемая после успешного выполнения.
	 */
	loadActiveToken(callback?: () => void): void {
		if (!this.isAuthenticated() || this.router.url === '/login') {
			this.showActivePanel = false;
			console.log('loadActiveToken: пользователь не авторизован или находится на /login.');
			if (callback) callback();
			return;
		}
		this.queueService.listAllTokens().subscribe({
			next: (tokens) => {
				console.log('loadActiveToken: получены токены', tokens);
				const found = tokens.find(t => t.status === 'Active');
				if (found) {
					this.activeToken = found;
					this.showActivePanel = true;
					console.log(`Активный талон: ${found.token}`);
				} else {
					this.activeToken = null;
					this.showActivePanel = false;
					console.log('Активный талон не найден.');
				}
				console.log('loadActiveToken: showActivePanel =', this.showActivePanel);
				if (callback) callback();
			},
			error: (err) => {
				console.error('Ошибка при загрузке талонов:', err);
				this.activeToken = null;
				this.showActivePanel = false;
				if (callback) callback();
			}
		});
	}

	/**
	 * Обработчик закрытия плавающей панели, поступающий из ActiveTokenComponent.
	 */
	onCloseTokenPanel(): void {
		this.activeToken = null;
		this.showActivePanel = false;
		console.log('Плавающая панель закрыта пользователем.');
	}

	logout(): void {
		this.authService.logout();
		this.activeToken = null;
		this.showActivePanel = false;
		this.router.navigate(['/login']);
		console.log('Пользователь вышел из системы.');
	}

	isAuthenticated(): boolean {
		return this.authService.isAuthenticated();
	}

	toggleReferences(): void {
		this.isReferencesExpanded = !this.isReferencesExpanded;
	}

	showContent(): boolean {
		return this.router.url !== '/login';
	}

	private setupInactivityListeners(): void {
		const events = ['click', 'keydown'];
		events.forEach(event => {
			const listener = () => this.authService.resetInactivityTimer();
			document.addEventListener(event, listener);
			this.inactivityListeners.push(() => document.removeEventListener(event, listener));
		});
		console.log('Отслеживание активности пользователя включено.');
	}

	ngOnDestroy(): void {
		this.inactivityListeners.forEach(removeListener => removeListener());
		if (this.authSubscription) {
			this.authSubscription.unsubscribe();
		}
		if (this.activeTokenCheckSubscription) {
			this.activeTokenCheckSubscription.unsubscribe();
		}
		if (this.routerEventsSubscription) {
			this.routerEventsSubscription.unsubscribe();
		}
		console.log('Слушатели активности пользователя удалены.');
	}

	toggleTransactions(): void {
		this.isTransactionsExpanded = !this.isTransactionsExpanded;
	}
}
