import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { PassesSummaryReportData, PassTypeDetail } from '../../../models/report.models';
import { ReportService } from '../../../services/report.service';
import { MatIconModule } from '@angular/material/icon';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { forkJoin, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export const MY_DATE_FORMATS = {
	parse: { dateInput: 'LL' },
	display: {
		dateInput: 'DD.MM.YYYY', monthYearLabel: 'MMM YY', dateA11yLabel: 'LL', monthYearA11yLabel: 'MMMM YY',
	},
};


@Component({
	selector: 'app-passes-summary-report',
	standalone: true,
	imports: [
		CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
		MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatTableModule,
		MatIconModule
	],
	templateUrl: './passes-summary-report.component.html',
	styleUrls: ['./passes-summary-report.component.css'],
	providers: [
		{ provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
		{ provide: DateAdapter, useClass: NativeDateAdapter },
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
		DatePipe
	],
	animations: [
		trigger('detailExpand', [
			state('collapsed, void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
			state('expanded', style({ height: '*', visibility: 'visible' })),
			transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
			transition('void => expanded', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
		]),
	],
})
export class PassesSummaryReportComponent implements OnInit {
	reportForm: FormGroup;
	// ВОЗВРАЩАЕМ 'actions'
	displayedColumns: string[] = ['queueType', 'totalAmount', 'passCount', 'actions'];
	detailColumns: string[] = ['passType', 'amount', 'count'];
	dataSource: PassesSummaryReportData[] = [];
	expandedElement: PassesSummaryReportData | null = null;

	// ... конструктор и остальные методы БЕЗ ИЗМЕНЕНИЙ ...
	constructor(
		private fb: FormBuilder,
		private reportService: ReportService,
		private datePipe: DatePipe
	) {
		this.reportForm = this.fb.group({
			startDate: [null, Validators.required],
			endDate: [null, Validators.required]
		});
	}

	ngOnInit(): void { }

	private formatDate(date: Date | null): string | null {
		return date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;
	}

	generateReport(): void {
		if (this.reportForm.invalid) {
			alert('Пожалуйста, выберите начальную и конечную даты.');
			return;
		}
		const { startDate, endDate } = this.reportForm.value;
		const dateParams = {
			startDate: this.formatDate(startDate),
			endDate: this.formatDate(endDate)
		};

		this.expandedElement = null;
		this.dataSource = [];

		this.reportService.getReportData('passes-summary', dateParams).subscribe((data: PassesSummaryReportData[]) => {
			this.dataSource = data.map(item => ({
				...item,
				showDetails: false,
				passTypeDetails: null,
				isLoadingDetails: false
			}));
		});
	}

	resetForm(): void {
		this.reportForm.reset();
		this.dataSource = [];
		this.expandedElement = null;
	}

	toggleDetails(element: PassesSummaryReportData): void {
		if (this.expandedElement === element) {
			this.expandedElement = null;
			element.showDetails = false;
		} else {
			if (this.expandedElement) {
				this.expandedElement.showDetails = false;
			}
			this.expandedElement = element;
			element.showDetails = true;

			if (!element.passTypeDetails) {
				element.isLoadingDetails = true;
				const { startDate, endDate } = this.reportForm.value;
				const dateParams = {
					startDate: this.formatDate(startDate),
					endDate: this.formatDate(endDate)
				};

				this.reportService.getPassTypeDetails(element.queueType, dateParams)
					.pipe(
						tap(() => element.isLoadingDetails = false),
						catchError(() => {
							element.isLoadingDetails = false;
							element.passTypeDetails = [];
							alert(`Не удалось загрузить детали для типа очереди: ${element.queueType}`);
							return of([]);
						})
					)
					.subscribe(details => {
						element.passTypeDetails = details as PassTypeDetail[];
					});
			}
		}
	}
}