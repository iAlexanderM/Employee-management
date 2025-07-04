import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
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


@Component({
	selector: 'app-report-list',
	standalone: true,
	imports: [
		MatListModule,
		CommonModule,
		RouterModule,
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