import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { ReportService } from '../../../services/report.service';
import { FinancialReportData } from '../../../models/report.models';
import { MatIconModule } from '@angular/material/icon';

export const MY_DATE_FORMATS = {
	parse: { dateInput: 'LL' },
	display: {
		dateInput: 'DD.MM.YYYY',
		monthYearLabel: 'MMM YYYY',
		dateA11yLabel: 'LL',
		monthYearA11yLabel: 'MMMM YYYY',
	},
};

@Component({
	selector: 'app-financial-report',
	standalone: true,
	imports: [
		CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
		MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatTableModule,
		MatIconModule
	],
	templateUrl: './financial-report.component.html',
	styleUrls: ['./financial-report.component.css'],
	providers: [
		{ provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
		{ provide: DateAdapter, useClass: NativeDateAdapter },
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
	]
})
export class FinancialReportComponent implements OnInit {
	reportForm: FormGroup;
	displayedColumns: string[] = ['tokenType', 'paidAmount', 'transactionCount'];
	dataSource: FinancialReportData[] = [];
	isLoading = false;

	constructor(private fb: FormBuilder, private reportService: ReportService) {
		this.reportForm = this.fb.group({
			startDate: [null, Validators.required],
			endDate: [null, Validators.required]
		});
	}

	ngOnInit(): void { }

	generateReport(): void {
		if (this.reportForm.invalid) {
			this.reportForm.markAllAsTouched();
			return;
		}
		this.isLoading = true;
		const { startDate, endDate } = this.reportForm.value;
		const formatDate = (date: Date) => {
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const year = date.getFullYear();
			return `${year}-${month}-${day}`;
		};
		const params = {
			startDate: formatDate(startDate),
			endDate: formatDate(endDate)
		};
		console.log('Params:', params);
		this.reportService.getReportData('financial', params).subscribe({
			next: (data) => {
				console.log('Received data:', data);
				this.dataSource = Array.isArray(data) ? data : [];
				console.log('dataSource after assignment:', this.dataSource);
				this.isLoading = false;
			},
			error: (err) => {
				console.error('Error fetching financial report:', err);
				this.dataSource = [];
				this.isLoading = false;
			}
		});
	}

	resetForm(): void {
		this.reportForm.reset();
		this.dataSource = [];
		this.isLoading = false;
	}

	downloadReport(): void {
		if (this.reportForm.invalid) {
			this.reportForm.markAllAsTouched();
			return;
		}
		const { startDate, endDate } = this.reportForm.value;
		const params = {
			startDate: startDate.toISOString().split('T')[0],
			endDate: endDate.toISOString().split('T')[0]
		};
		this.reportService.downloadReport('financial', params).subscribe({
			next: (blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = 'FinancialReport.xlsx';
				link.click();
				window.URL.revokeObjectURL(url);
			},
			error: (err) => {
				console.error('Error downloading report:', err);
			}
		});
	}
}