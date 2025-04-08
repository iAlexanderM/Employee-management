import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
// Импортируем необходимые токены и адаптер
import {
	MatNativeDateModule,
	MAT_DATE_LOCALE,
	DateAdapter,
	MAT_DATE_FORMATS,
	NativeDateAdapter
} from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { ReportService } from '../../../services/report.service';
import { FinancialReportData } from '../../../models/report.models';
import { MatIconModule } from '@angular/material/icon';

// Определяем кастомные форматы дат
export const MY_DATE_FORMATS = {
	parse: {
		dateInput: 'LL', // Формат для парсинга ввода (Moment.js/Luxon синтаксис, NativeDateAdapter может игнорировать)
	},
	display: {
		dateInput: 'DD.MM.YYYY', // <--- Вот нужный формат отображения в поле ввода
		monthYearLabel: 'MMM YYYY', // Формат в заголовке календаря
		dateA11yLabel: 'LL', // Формат для скринридеров
		monthYearA11yLabel: 'MMMM YYYY', // Формат месяца/года для скринридеров
	},
};

// Кастомный DateAdapter для корректного парсинга DD.MM.YYYY (если Native не справляется)
// Можно использовать готовые адаптеры (Moment, Luxon) или расширить NativeDateAdapter
// Для простоты пока оставим NativeDateAdapter и будем полагаться на display формат
// Если ввод DD.MM.YYYY не заработает, потребуется более сложный адаптер

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
		// Указываем локаль (для названий месяцев, дней недели)
		{ provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
		// Используем стандартный NativeDateAdapter
		{ provide: DateAdapter, useClass: NativeDateAdapter },
		// Предоставляем наши кастомные форматы
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS }
	]
})
export class FinancialReportComponent implements OnInit {
	reportForm: FormGroup;
	displayedColumns: string[] = ['tokenType', 'paidAmount', 'transactionCount'];
	dataSource: FinancialReportData[] = [];

	// ... остальной код конструктора и методов без изменений ...
	constructor(private fb: FormBuilder, private reportService: ReportService) {
		this.reportForm = this.fb.group({
			startDate: [null, Validators.required],
			endDate: [null, Validators.required]
		});
	}

	ngOnInit(): void { }

	generateReport(): void {
		if (this.reportForm.invalid) {
			alert('Пожалуйста, выберите начальную и конечную даты.');
			return;
		}
		const { startDate, endDate } = this.reportForm.value;
		// При отправке дата ВСЕГДА будет в стандартном формате JS Date,
		// форматируем перед отправкой на бэкенд
		const params = {
			startDate: startDate.toISOString().split('T')[0],
			endDate: endDate.toISOString().split('T')[0]
		};
		this.reportService.getReportData('financial', params).subscribe((data: FinancialReportData[]) => {
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
			startDate: startDate.toISOString().split('T')[0],
			endDate: endDate.toISOString().split('T')[0]
		};
		this.reportService.downloadReport('financial', params).subscribe(blob => {
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'FinancialReport.xlsx';
			link.click();
			window.URL.revokeObjectURL(url);
		});
	}
}