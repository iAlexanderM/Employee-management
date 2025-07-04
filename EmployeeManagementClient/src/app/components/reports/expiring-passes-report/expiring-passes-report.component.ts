import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { ReportService } from '../../../services/report.service';
import { ExpiringPassesReportData } from '../../../models/report.models';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';

export const MY_DATE_FORMATS = {
	parse: { dateInput: 'DD.MM.YYYY' },
	display: { dateInput: 'DD.MM.YYYY', monthYearLabel: 'MMM YYYY', dateA11yLabel: 'LL', monthYearA11yLabel: 'MMMM YYYY' },
};

@Component({
	selector: 'app-expiring-passes-report',
	standalone: true,
	imports: [
		CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
		MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatTableModule,
		MatIconModule, MatPaginatorModule, MatGridListModule, MatCardModule
	],
	templateUrl: './expiring-passes-report.component.html',
	styleUrls: ['./expiring-passes-report.component.css'],
	providers: [
		{ provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
		{ provide: DateAdapter, useClass: NativeDateAdapter },
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
	]
})
export class ExpiringPassesReportComponent implements OnInit {
	reportForm: FormGroup;
	displayedColumns: string[] = [
		'passType', 'endDate', 'building', 'floor', 'line', 'storeNumber', 'contractorId', 'fullName', 'position', 'note'
	];
	dataSource: ExpiringPassesReportData[] = [];
	totalCount = 0;
	pageSize = 50;
	pageIndex = 0;
	isLoading = false;

	@ViewChild(MatPaginator) paginator!: MatPaginator;

	constructor(
		private fb: FormBuilder,
		private reportService: ReportService
	) {
		this.reportForm = this.fb.group({
			startDate: [null, Validators.required],
			endDate: [null, Validators.required]
		});
	}

	ngOnInit(): void { }

	private formatDate(date: Date): string {
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${year}-${month}-${day}`;
	}

	generateReport(): void {
		if (this.reportForm.invalid) {
			this.reportForm.markAllAsTouched();
			return;
		}
		this.isLoading = true;
		const { startDate, endDate } = this.reportForm.value;
		const params = {
			startDate: this.formatDate(startDate),
			endDate: this.formatDate(endDate)
		};

		console.log('Generated params:', params);

		this.reportService.getReportData('expiring-passes', params, this.pageIndex + 1, this.pageSize).subscribe({
			next: (response: { totalCount: number, data: ExpiringPassesReportData[] }) => {
				console.log('Received data:', response.data); // Update to response.data
				this.dataSource = response.data || [];
				this.totalCount = response.totalCount ?? 0;
				this.isLoading = false;
			},
			error: (err) => {
				console.error('Error fetching expiring passes:', err);
				this.dataSource = [];
				this.totalCount = 0;
				this.isLoading = false;
			}
		});
	}

	onPageChange(event: PageEvent): void {
		this.pageIndex = event.pageIndex;
		this.pageSize = event.pageSize;
		this.generateReport();
	}

	resetForm(): void {
		this.reportForm.reset();
		this.dataSource = [];
		this.pageIndex = 0;
		this.totalCount = 0;
		this.isLoading = false;
	}

	downloadReport(): void {
		if (this.reportForm.invalid) {
			this.reportForm.markAllAsTouched();
			return;
		}
		const { startDate, endDate } = this.reportForm.value;
		const params = {
			startDate: this.formatDate(startDate),
			endDate: this.formatDate(endDate)
		};

		this.reportService.downloadReport('expiring-passes', params).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = 'ExpiringPassesReport.xlsx';
				link.click();
				window.URL.revokeObjectURL(url);
			},
			error: (err) => {
				console.error('Error downloading report:', err);
			}
		});
	}
}