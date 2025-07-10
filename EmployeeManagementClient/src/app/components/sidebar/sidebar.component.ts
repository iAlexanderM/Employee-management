// sidebar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

@Component({
	selector: 'app-sidebar',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		MatListModule,
		MatButtonModule,
		MatIconModule,
		MatRippleModule
	],
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
	private routerEventsSubscription: Subscription | null = null;

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
				{ propertyName: 'Добавить пользователя' },
				{ propertyName: 'Список пользователей' }
			]
		}
	];

	constructor(
		private authService: AuthService,
		private router: Router
	) { }

	ngOnInit(): void {
		this.routerEventsSubscription = this.router.events
			.pipe(filter(event => event instanceof NavigationEnd))
			.subscribe(() => { });
	}

	toggleAccordionState(index: number): void {
		this.data[index].isActive = !this.data[index].isActive;
	}

	logout(): void {
		this.authService.logout();
		this.router.navigate(['/login']);
	}

	isAuthenticated(): boolean {
		return this.authService.isAuthenticated();
	}

	hasAccessToChild(childProperties: { propertyName: string }[]): boolean {
		return childProperties.some(child => this.hasRole(this.getRequiredRole(child.propertyName)));
	}

	hasRole(requiredRole: string): boolean {
		const userRoles = this.authService.getUserRoles();
		if (userRoles.includes('Admin') || userRoles.includes('Cashier')) {
			return true;
		}
		if (requiredRole === 'Any' || userRoles.includes(requiredRole)) {
			return true;
		}
		return false;
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
			case 'Список пользователей': return '/users';
			default: return '';
		}
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
			case 'Список пользователей':
				return 'Admin';
			default:
				return 'Any';
		}
	}

	ngOnDestroy(): void {
		if (this.routerEventsSubscription) {
			this.routerEventsSubscription.unsubscribe();
		}
	}
}