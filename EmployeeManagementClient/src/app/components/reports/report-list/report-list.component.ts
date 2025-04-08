import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';

@Component({
	selector: 'app-report-list',
	standalone: true,
	imports: [CommonModule, RouterModule, MatListModule, MatButtonModule],
	templateUrl: './report-list.component.html',
	styleUrls: ['./report-list.component.css']
})
export class ReportListComponent {
	constructor(private authService: AuthService) { }

	reports = [
		{ id: 'financial', name: 'Полный финансовый отчёт', path: '/reports/financial' },
		{ id: 'passes-summary', name: 'Сумма и количество пропусков', path: '/reports/passes-summary' },
		{ id: 'issued-passes', name: 'Список выписанных пропусков', path: '/reports/issued-passes' },
		{ id: 'expiring-passes', name: 'Список заканчивающихся пропусков', path: '/reports/expiring-passes' },
		{ id: 'active-passes', name: 'Список действующих пропусков', path: '/reports/active-passes' }
	];

	canViewReport(reportId: string): boolean {
		const userRoles = this.authService.getUserRoles();
		if (userRoles.includes('Admin') || userRoles.includes('Cashier')) {
			return true;
		}
		if (reportId === 'financial' || reportId === 'passes-summary') {
			return false;
		}
		return true;
	}
}