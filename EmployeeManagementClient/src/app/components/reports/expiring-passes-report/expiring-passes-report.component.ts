import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
	MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter,
	MAT_DATE_FORMATS, NativeDateAdapter
} from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { ReportService } from '../../../services/report.service';
import { ExpiringPassesReportData } from '../../../models/report.models';
import { MatIconModule } from '@angular/material/icon';

// Копируем определение форматов
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
	selector: 'app-expiring-passes-report',
	standalone: true,
	imports: [
		CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
		MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatTableModule,
		MatIconModule, DatePipe
	],
	templateUrl: './expiring-passes-report.component.html',
	styleUrls: ['./expiring-passes-report.component.css'],
	providers: [ // Добавляем провайдеры
		{ provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
		{ provide: DateAdapter, useClass: NativeDateAdapter },
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
		DatePipe
	]
})
export class ExpiringPassesReportComponent implements OnInit {
	reportForm: FormGroup;
	displayedColumns: string[] = [
		'passType', 'endDate', 'building', 'floor', 'line', 'storeNumber', 'contractorId', 'fullName', 'position', 'note'
	];
	dataSource: ExpiringPassesReportData[] = [];

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
		const params = {
			startDate: this.formatDate(startDate),
			endDate: this.formatDate(endDate)
		};
		this.reportService.getReportData('expiring-passes', params).subscribe((data: ExpiringPassesReportData[]) => {
			this.dataSource = data;
		});
	}

	resetForm(): void {
		this.reportForm.reset();
		this.dataSource = [];
	}

	downloadReport(): void {
		if (this.reportForm.invalid) {
			alert('Пожалуйста, выберите начальную и конечную даты.');
			return;
		}
		const { startDate, endDate } = this.reportForm.value;
		const params = {
			startDate: this.formatDate(startDate),
			endDate: this.formatDate(endDate)
		};
		this.reportService.downloadReport('expiring-passes', params).subscribe(blob => {
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'ExpiringPassesReport.xlsx';
			link.click();
			window.URL.revokeObjectURL(url);
		});
	}
}