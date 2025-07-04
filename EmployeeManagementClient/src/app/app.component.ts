import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { QueueService } from './services/queue.service';
import { SignalRService } from './services/signalr.service';
import { ActiveTokenComponent } from './components/modals/active-token/active-token-floating.component';
import { QueueToken } from './models/queue.model';
import { CommonModule } from '@angular/common';
import { QueueSyncService } from './services/queue-sync.service';

@Component({
    selector: 'app-root',
    imports: [CommonModule, RouterModule, ActiveTokenComponent],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
	isReferencesExpanded = false;
	isTransactionsExpanded = false;
	title = 'Employee Management';
	private inactivityListeners: (() => void)[] = [];
	private authSubscription: Subscription | null = null;
	private activeTokenCheckSubscription: Subscription | null = null;
	private routerEventsSubscription: Subscription | null = null;
	private contentContainerElement: HTMLElement | null = null;
	private referencesAccordionElement: HTMLElement | null = null;
	private transactionsAccordionElement: HTMLElement | null = null;
	showActivePanel = false;
	activeToken: QueueToken | null = null;
	currentPage: number = 1;
	pageSize: number = 25;

	data = [
		{ parentName: 'Отчёты', isActive: false, routerLink: '/reports' },
		{ parentName: 'Список очереди', isActive: false, routerLink: '/queue' },
		{ parentName: 'Поиск по торговой точке', isActive: false, routerLink: '/passes/store-pass-search' },
		{
			parentName: 'Транзакции',
			isActive: false,
			childProperties: [
				{ propertyName: 'Список транзакций' },
				{ propertyName: 'Создать транзакцию' }
			]
		},
		{
			parentName: 'Печать пропусков',
			isActive: false,
			childProperties: [
				{ propertyName: 'Очередь на печать пропусков' },
				{ propertyName: 'Выданные пропуска' }
			]
		},
		{
			parentName: 'Справочники',
			isActive: false,
			childProperties: [
				{ propertyName: 'Добавление нового контрагента' },
				{ propertyName: 'Список контрагентов' },
				{ propertyName: 'Добавление торговой точки' },
				{ propertyName: 'Список торговых точек' },
				{ propertyName: 'Здание' },
				{ propertyName: 'Этаж' },
				{ propertyName: 'Линия' },
				{ propertyName: 'Точка' },
				{ propertyName: 'Гражданство' },
				{ propertyName: 'Национальность' },
				{ propertyName: 'Группы пропусков' },
				{ propertyName: 'Должности' }
			]
		},
		{
			parentName: 'Администрирование',
			isActive: false,
			childProperties: [
				{ propertyName: 'Добавить пользователя' }
			]
		}
	];

	constructor(
		private authService: AuthService,
		private queueService: QueueService,
		private signalRService: SignalRService,
		private queueSyncService: QueueSyncService,
		private router: Router,
		private elRef: ElementRef,
		private renderer: Renderer2
	) {
		this.setupInactivityListeners();
		this.authSubscription = this.authService.initializeToken().subscribe(isAuthenticated => {
			if (!isAuthenticated) {
				console.warn('Пользователь не авторизован. -> /login');
				this.router.navigate(['/login']);
			} else {
				console.log('Пользователь авторизован. Запускаем SignalR.');
				this.startSignalR();
				if (this.router.url === '/login') {
					this.router.navigate(['/dashboard']);
				}
				this.loadActiveToken(() => {
					console.log('Метод loadActiveToken() успешно выполнен после входа.');
				});
			}
		});
		this.activeTokenCheckSubscription = this.authService.activeTokenCheck$.subscribe(() => {
			console.log('Событие activeTokenCheck получено. Вызывается метод loadActiveToken().');
			this.loadActiveToken(() => {
				console.log('Метод loadActiveToken() успешно выполнен после события activeTokenCheck.');
			});
		});
	}

	ngOnInit(): void {
		this.routerEventsSubscription = this.router.events
			.pipe(filter(event => event instanceof NavigationEnd))
			.subscribe(() => {
				if (this.isAuthenticated() && this.router.url !== '/login') {
					console.log('Навигация завершена. Вызывается метод loadActiveToken().');
					this.loadActiveToken(() => {
						console.log('Метод loadActiveToken() успешно выполнен после навигации.');
					});
				}
			});
	}

	ngAfterViewInit(): void {
		this.contentContainerElement = this.elRef.nativeElement.querySelector('.content-container');
	}

	private startSignalR(): void {
		this.signalRService.startConnection()
			.then(() => {
				console.log('SignalR: startConnection success.');
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

	loadActiveToken(callback?: () => void): void {
		if (!this.isAuthenticated() || this.router.url === '/login') {
			this.showActivePanel = false;
			console.log('loadActiveToken: пользователь не авторизован или находится на /login.');
			if (callback) callback();
			return;
		}

		this.queueService.listAllTokens(this.currentPage, this.pageSize).subscribe({
			next: (result: { total: number; tokens: QueueToken[] }) => {
				console.log('loadActiveToken: получены данные', result);
				const tokensArray: QueueToken[] = result.tokens;
				const found = tokensArray.find((t: QueueToken) => t.status === 'Active');
				if (found) {
					this.activeToken = found;
					this.showActivePanel = true;
					console.log(`Активный талон: ${found.token}`);
					this.queueSyncService.setActiveToken(found.token);
				} else {
					this.activeToken = null;
					this.showActivePanel = false;
					console.log('Активный талон не найден.');
					this.queueSyncService.setActiveToken('');
				}
				if (callback) callback();
			},
			error: (err) => {
				console.error('Ошибка при загрузке талонов:', err);
				this.activeToken = null;
				this.showActivePanel = false;
				this.queueSyncService.setActiveToken('');
				if (callback) callback();
			}
		});
	}

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

	toggleAccordian(event: Event, index: number): void {
		const element = event.target as HTMLElement;
		element.classList.toggle('active');
		this.data[index].isActive = !this.data[index].isActive;
		this.adjustContentPosition(element, this.data[index].isActive);
	}

	private adjustContentPosition(element: HTMLElement, expanded: boolean): void {
		const nextSibling = element.nextElementSibling as HTMLElement;
		const marginTop = expanded ? `${nextSibling?.offsetHeight}px` : '0';
		if (this.contentContainerElement) {
			this.renderer.setStyle(this.contentContainerElement, 'margin-top', marginTop);
		}
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

	getRouterLink(propertyName: string): string {
		switch (propertyName) {
			case 'Отчёты': return '/reports';
			case 'Список очереди': return '/queue';
			case 'Поиск по торговой точке': return '/passes/store-pass-search';
			case 'Список транзакций': return '/transactions';
			case 'Создать транзакцию': return '/transactions/create';
			case 'Очередь на печать пропусков': return '/passes/print-queue';
			case 'Выданные пропуска': return '/passes/issued';
			case 'Добавление нового контрагента': return '/contractors/new';
			case 'Список контрагентов': return '/contractors';
			case 'Добавление торговой точки': return '/stores/new';
			case 'Список торговых точек': return '/stores';
			case 'Здание': return '/building';
			case 'Этаж': return '/floor';
			case 'Линия': return '/line';
			case 'Точка': return '/storeNumber';
			case 'Гражданство': return '/citizenship';
			case 'Национальность': return '/nationality';
			case 'Группы пропусков': return '/pass-groups';
			case 'Должности': return '/positions';
			case 'Добавить пользователя': return '/add-user';
			default: return '';
		}
	}

	showContent(): boolean {
		return this.router.url !== '/login';
	}

	hasAccessToChild(childProperties: { propertyName: string }[]): boolean {
		const userRoles = this.authService.getUserRoles();
		return childProperties.some(child => this.hasRole(this.getRequiredRole(child.propertyName)));
	}

	hasRole(requiredRole: string): boolean {
		const userRoles = this.authService.getUserRoles();
		if (userRoles.includes('Admin') || userRoles.includes('Cashier')) {
			return true; // Admin и Cashier имеют доступ ко всему
		}
		if (requiredRole === 'Any' || userRoles.includes(requiredRole)) {
			return true;
		}
		return false;
	}

	getRequiredRole(propertyName: string): string {
		switch (propertyName) {
			case 'Добавление нового контрагента':
			case 'Добавление торговой точки':
			case 'Здание':
			case 'Этаж':
			case 'Линия':
			case 'Точка':
			case 'Гражданство':
			case 'Национальность':
			case 'Группы пропусков':
			case 'Должности':
			case 'Создать транзакцию':
			case 'Очередь на печать пропусков':
			case 'Выданные пропуска':
			case 'Список очереди':
			case 'Отчёты':
			case 'Список контрагентов':
			case 'Список торговых точек':
			case 'Список транзакций':
			case 'Поиск по торговой точке':
				return 'Any';
			case 'Добавить пользователя':
				return 'Admin';
			default:
				return 'Any';
		}
	}
}