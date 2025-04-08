import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
	MatNativeDateModule, MAT_DATE_LOCALE, DateAdapter,
	MAT_DATE_FORMATS, NativeDateAdapter
} from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { ReportService } from '../../../services/report.service';
import { IssuedPassesReportData } from '../../../models/report.models';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, startWith } from 'rxjs/operators';

export const MY_DATE_FORMATS = {
	parse: { dateInput: 'LL' },
	display: {
		dateInput: 'DD.MM.YYYY', monthYearLabel: 'MMM YYYY', dateA11yLabel: 'LL', monthYearA11yLabel: 'MMMM YYYY',
	},
};

@Component({
	selector: 'app-issued-passes-report',
	standalone: true,
	imports: [
		CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
		MatButtonModule, MatDatepickerModule, MatNativeDateModule, MatTableModule,
		MatIconModule, DatePipe, MatAutocompleteModule
	],
	templateUrl: './issued-passes-report.component.html',
	styleUrls: ['./issued-passes-report.component.css'],
	providers: [
		{ provide: MAT_DATE_LOCALE, useValue: 'ru-RU' },
		{ provide: DateAdapter, useClass: NativeDateAdapter },
		{ provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
		DatePipe
	]
})
export class IssuedPassesReportComponent implements OnInit, OnDestroy {
	reportForm: FormGroup;
	displayedColumns: string[] = [
		'passType', 'building', 'floor', 'line', 'storeNumber', 'contractorId', 'fullName',
		'position', 'citizenship', 'nationality', 'startDate', 'endDate', 'status', 'phone', 'productType'
	];
	dataSource: IssuedPassesReportData[] = [];

	// Observable для подсказок
	passTypeSuggestions$!: Observable<string[]>;
	buildingSuggestions$!: Observable<string[]>;
	floorSuggestions$!: Observable<string[]>;
	lineSuggestions$!: Observable<string[]>;

	private destroy$ = new Subject<void>();

	constructor(
		private fb: FormBuilder,
		private reportService: ReportService,
		private datePipe: DatePipe
	) {
		this.reportForm = this.fb.group({
			startDate: [null, Validators.required],
			endDate: [null, Validators.required],
			building: [''],
			floor: [''],
			line: [''],
			passType: [''] // Заменили passTypeId на passType
		});
	}

	ngOnInit(): void {
		this.setupAutocomplete();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private setupAutocomplete(): void {
		const passTypeControl = this.reportForm.get('passType');
		const buildingControl = this.reportForm.get('building');
		const floorControl = this.reportForm.get('floor');
		const lineControl = this.reportForm.get('line');

		// Автодополнение для типа пропуска
		if (passTypeControl) {
			this.passTypeSuggestions$ = passTypeControl.valueChanges.pipe(
				startWith(''),
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(value => this.reportService.getPassTypeSuggestions(value || '')),
				takeUntil(this.destroy$)
			);
		}

		if (buildingControl) {
			this.buildingSuggestions$ = buildingControl.valueChanges.pipe(
				startWith(''),
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(value => this.reportService.getSuggestions('building', value || '')),
				takeUntil(this.destroy$)
			);
		}

		if (floorControl && buildingControl) {
			this.floorSuggestions$ = floorControl.valueChanges.pipe(
				startWith(''),
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(value => this.reportService.getSuggestions('floor', value || '', { building: buildingControl.value })),
				takeUntil(this.destroy$)
			);
			buildingControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => floorControl.updateValueAndValidity({ emitEvent: true }));
		}

		if (lineControl && buildingControl && floorControl) {
			this.lineSuggestions$ = lineControl.valueChanges.pipe(
				startWith(''),
				debounceTime(300),
				distinctUntilChanged(),
				switchMap(value => this.reportService.getSuggestions('line', value || '', { building: buildingControl.value, floor: floorControl.value })),
				takeUntil(this.destroy$)
			);
			buildingControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => lineControl.updateValueAndValidity({ emitEvent: true }));
			floorControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => lineControl.updateValueAndValidity({ emitEvent: true }));
		}
	}

	private formatDate(date: Date | null): string | null {
		return date ? this.datePipe.transform(date, 'yyyy-MM-dd') : null;
	}

	generateReport(): void {
		if (this.reportForm.invalid) {
			alert('Пожалуйста, выберите начальную и конечную даты.');
			return;
		}
		const values = this.reportForm.value;
		const params: any = {
			startDate: this.formatDate(values.startDate),
			endDate: this.formatDate(values.endDate)
		};
		if (values.building) params.building = values.building;
		if (values.floor) params.floor = values.floor;
		if (values.line) params.line = values.line;
		if (values.passType) params.passType = values.passType; // Передаем имя типа пропуска

		this.reportService.getReportData('issued-passes', params).subscribe((data: IssuedPassesReportData[]) => {
			this.dataSource = data;
		});
	}

	resetForm(): void {
		this.reportForm.reset({ startDate: null, endDate: null, building: '', floor: '', line: '', passType: '' });
		this.dataSource = [];
		this.reportForm.get('building')?.updateValueAndValidity();
		this.reportForm.get('floor')?.updateValueAndValidity();
		this.reportForm.get('line')?.updateValueAndValidity();
		this.reportForm.get('passType')?.updateValueAndValidity();
	}

	downloadReport(): void {
		if (this.reportForm.invalid) {
			alert('Пожалуйста, выберите начальную и конечную даты.');
			return;
		}
		const values = this.reportForm.value;
		const params: any = {
			startDate: this.formatDate(values.startDate),
			endDate: this.formatDate(values.endDate)
		};
		if (values.building) params.building = values.building;
		if (values.floor) params.floor = values.floor;
		if (values.line) params.line = values.line;
		if (values.passType) params.passType = values.passType;

		this.reportService.downloadReport('issued-passes', params).subscribe(blob => {
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'IssuedPassesReport.xlsx';
			link.click();
			window.URL.revokeObjectURL(url);
		});
	}
}