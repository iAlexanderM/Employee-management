import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { AuthService } from './services/auth.service';
import { QueueService } from './services/queue.service';
import { SignalRService } from './services/signalr.service';
import { QueueSyncService } from './services/queue-sync.service';

import { ActiveTokenComponent } from './components/modals/active-token/active-token-floating.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';

import { QueueToken } from './models/queue.model';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		ActiveTokenComponent,
		SidebarComponent,
		MatSidenavModule,
		HeaderComponent
	],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
	title = 'Employee Management';
	private inactivityListeners: (() => void)[] = [];
	private authSubscription: Subscription | null = null;
	private activeTokenCheckSubscription: Subscription | null = null;
	private routerEventsSubscription: Subscription | null = null;

	showActivePanel = false;
	activeToken: QueueToken | null = null;
	currentPage: number = 1;
	pageSize: number = 25;

	constructor(
		private authService: AuthService,
		private queueService: QueueService,
		private signalRService: SignalRService,
		private queueSyncService: QueueSyncService,
		private router: Router
	) {
		this.setupInactivityListeners();

		this.authSubscription = this.authService.initializeToken().subscribe(isAuthenticated => {
			if (!isAuthenticated) {
				this.router.navigate(['/login']);
			} else {
				this.startSignalR();
				if (this.router.url === '/login') {
					this.router.navigate(['/dashboard']);
				}
				this.loadActiveToken(() => { });
			}
		});

		this.activeTokenCheckSubscription = this.authService.activeTokenCheck$.subscribe(() => {
			this.loadActiveToken(() => { });
		});
	}

	ngOnInit(): void {
		this.routerEventsSubscription = this.router.events
			.pipe(filter(event => event instanceof NavigationEnd))
			.subscribe(() => {
				if (this.isAuthenticated() && this.router.url !== '/login') {
					this.loadActiveToken(() => { });
				}
			});
	}

	showContent(): boolean {
		return this.router.url !== '/login';
	}

	private startSignalR(): void {
		this.signalRService.startConnection()
			.then(() => {
				this.signalRService.onQueueUpdated(() => {
					this.loadActiveToken(() => { });
				});
			})
			.catch(err => {
				console.error('SignalR start error:', err);
			});
	}

	loadActiveToken(callback?: () => void): void {
		if (!this.isAuthenticated() || this.router.url === '/login') {
			this.showActivePanel = false;
			this.activeToken = null;
			this.queueSyncService.setActiveToken('');
			if (callback) callback();
			return;
		}

		this.queueService.listAllTokens(this.currentPage, this.pageSize).subscribe({
			next: (result: { total: number; tokens: QueueToken[] }) => {
				const tokensArray: QueueToken[] = result.tokens;
				const found = tokensArray.find((t: QueueToken) => t.status === 'Active');
				if (found) {
					this.activeToken = found;
					this.showActivePanel = true;
					this.queueSyncService.setActiveToken(found.token);
				} else {
					this.activeToken = null;
					this.showActivePanel = false;
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
	}

	isAuthenticated(): boolean {
		return this.authService.isAuthenticated();
	}

	private setupInactivityListeners(): void {
		const events = ['click', 'keydown', 'mousemove', 'scroll'];
		events.forEach(event => {
			const listener = () => this.authService.resetInactivityTimer();
			document.addEventListener(event, listener);
			this.inactivityListeners.push(() => document.removeEventListener(event, listener));
		});
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
	}
}