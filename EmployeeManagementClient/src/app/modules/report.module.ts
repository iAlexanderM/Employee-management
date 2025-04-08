import { Routes } from '@angular/router';
import { ReportListComponent } from '../components/reports/report-list/report-list.component';
import { FinancialReportComponent } from '../components/reports/financial-report/financial-report.component';
import { PassesSummaryReportComponent } from '../components/reports/passes-summary-report/passes-summary-report.component';
import { IssuedPassesReportComponent } from '../components/reports/issued-passes-report/issued-passes-report.component';
import { ExpiringPassesReportComponent } from '../components/reports/expiring-passes-report/expiring-passes-report.component';
import { ActivePassesReportComponent } from '../components/reports/active-passes-report/active-passes-report.component';

export const reportRoutes: Routes = [
	{ path: '', component: ReportListComponent },
	{ path: 'financial', component: FinancialReportComponent },
	{ path: 'passes-summary', component: PassesSummaryReportComponent },
	{ path: 'issued-passes', component: IssuedPassesReportComponent },
	{ path: 'expiring-passes', component: ExpiringPassesReportComponent },
	{ path: 'active-passes', component: ActivePassesReportComponent }
];