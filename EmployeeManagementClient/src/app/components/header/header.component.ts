import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { MatRippleModule } from '@angular/material/core';

interface HeaderLink {
	name: string;
	routerLink?: string; // routerLink is now optional for links that trigger methods
	iconType: 'material' | 'customHtml' | 'svgPath';
	iconValue: string;
}

@Component({
	selector: 'app-header',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		MatButtonModule,
		MatIconModule,
		MatToolbarModule,
		MatTooltipModule,
		MatRippleModule
	],
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.css']
})
export class HeaderComponent {
	queueLink: HeaderLink = { name: 'Список очереди', iconType: 'material', iconValue: 'list_alt', routerLink: '/queue' };
	storeSearchLink: HeaderLink = { name: 'Поиск по торговой точке', iconType: 'material', iconValue: 'storefront', routerLink: '/passes/store-pass-search' };
	contractorsListLink: HeaderLink = { name: 'Список контрагентов', iconType: 'material', iconValue: 'groups', routerLink: '/contractors' };
	newContractorLink: HeaderLink = { name: 'Добавление нового контрагента', iconType: 'material', iconValue: 'person_add_alt_1', routerLink: '/contractors/new' };
	storesListLink: HeaderLink = { name: 'Список торговых точек', iconType: 'material', iconValue: 'location_on', routerLink: '/stores' };
	reportsLink: HeaderLink = { name: 'Отчёты', iconType: 'material', iconValue: 'analytics', routerLink: '/reports' };
	logoutLink: HeaderLink = { name: 'Выход', iconType: 'material', iconValue: 'logout' };

	constructor(
		private router: Router,
		private sanitizer: DomSanitizer,
		private authService: AuthService
	) { }

	getSafeHtml(html: string): SafeHtml {
		return this.sanitizer.bypassSecurityTrustHtml(html);
	}

	navigateTo(link: string): void {
		this.router.navigate([link]);
	}

	handleLogout(): void {
		this.authService.logout();
		this.router.navigate(['/login']);
	}
}