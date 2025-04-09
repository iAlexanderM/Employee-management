import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReportService } from '../../../services/report.service';
import { ActivePassesReportData } from '../../../models/report.models';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil, startWith } from 'rxjs/operators';

@Component({
	selector: 'app-active-passes-report',
	standalone: true,
	imports: [
		CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
		MatButtonModule, MatTableModule, MatIconModule, MatAutocompleteModule,
		MatCheckboxModule
	],
	templateUrl: './active-passes-report.component.html',
	styleUrls: ['./active-passes-report.component.css']
})
export class ActivePassesReportComponent implements OnInit, OnDestroy {
	reportForm: FormGroup;
	baseDisplayedColumns: string[] = [
		'index', 'passType', 'building', 'floor', 'line', 'storeNumber', 'contractorId', 'fullName',
		'position', 'startDate', 'endDate', 'passNumber'
	];
	optionalColumns: string[] = [
		'citizenship', 'nationality', 'phone', 'documentType', 'passportSerialNumber',
		'passportIssuedBy', 'passportIssueDate', 'productType', 'birthDate'
	];
	displayedColumns: string[] = [...this.baseDisplayedColumns];
	dataSource: ActivePassesReportData[] = [];
	passTypeSuggestions$!: Observable<string[]>;
	buildingSuggestions$!: Observable<string[]>;
	floorSuggestions$!: Observable<string[]>;
	lineSuggestions$!: Observable<string[]>;
	private destroy$ = new Subject<void>();

	constructor(
		private fb: FormBuilder,
		private reportService: ReportService
	) {
		this.reportForm = this.fb.group({
			passType: [''],
			building: [''],
			floor: [''],
			line: [''],
			citizenship: [false], nationality: [false], phone: [false],
			documentType: [false], passportSerialNumber: [false], passportIssuedBy: [false],
			passportIssueDate: [false], productType: [false], birthDate: [false]
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

		this.passTypeSuggestions$ = passTypeControl!.valueChanges.pipe(
			startWith(''), debounceTime(300), distinctUntilChanged(),
			switchMap(value => this.reportService.getPassTypeSuggestions(value || '')),
			takeUntil(this.destroy$)
		);

		this.buildingSuggestions$ = buildingControl!.valueChanges.pipe(
			startWith(''), debounceTime(300), distinctUntilChanged(),
			switchMap(value => this.reportService.getSuggestions('building', value || '')),
			takeUntil(this.destroy$)
		);

		this.floorSuggestions$ = floorControl!.valueChanges.pipe(
			startWith(''), debounceTime(300), distinctUntilChanged(),
			switchMap(value => this.reportService.getSuggestions('floor', value || '', { building: buildingControl!.value })),
			takeUntil(this.destroy$)
		);
		buildingControl!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => floorControl!.updateValueAndValidity());

		this.lineSuggestions$ = lineControl!.valueChanges.pipe(
			startWith(''), debounceTime(300), distinctUntilChanged(),
			switchMap(value => this.reportService.getSuggestions('line', value || '', { building: buildingControl!.value, floor: floorControl!.value })),
			takeUntil(this.destroy$)
		);
		buildingControl!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => lineControl!.updateValueAndValidity());
		floorControl!.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => lineControl!.updateValueAndValidity());
	}

	generateReport(): void {
		const values = this.reportForm.value;
		const params: any = {};
		if (values.passType) params.passType = values.passType;
		if (values.building) params.building = values.building;
		if (values.floor) params.floor = values.floor;
		if (values.line) params.line = values.line;

		console.log('Generated params:', params);

		this.reportService.getReportData('active-passes', params).subscribe({
			next: (data: ActivePassesReportData[]) => {
				console.log('Received data:', data);
				this.dataSource = data.map((item, index) => ({ ...item, index: index + 1 }));
				this.updateDisplayedColumns();
			},
			error: (err) => console.error('Error fetching report:', err)
		});
	}

	private updateDisplayedColumns(): void {
		const values = this.reportForm.value;
		this.displayedColumns = [...this.baseDisplayedColumns];
		this.optionalColumns.forEach(column => {
			if (values[column]) this.displayedColumns.push(column);
		});
	}

	resetForm(): void {
		this.reportForm.reset({
			passType: '', building: '', floor: '', line: '',
			citizenship: false, nationality: false, phone: false,
			documentType: false, passportSerialNumber: false, passportIssuedBy: false,
			passportIssueDate: false, productType: false, birthDate: false
		});
		this.dataSource = [];
		this.displayedColumns = [...this.baseDisplayedColumns];
	}

	downloadReport(): void {
		const values = this.reportForm.value;
		const params: any = {};
		if (values.passType) params.passType = values.passType;
		if (values.building) params.building = values.building;
		if (values.floor) params.floor = values.floor;
		if (values.line) params.line = values.line;

		this.reportService.downloadReport('active-passes', params).subscribe(blob => {
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'ActivePassesReport.xlsx';
			link.click();
			window.URL.revokeObjectURL(url);
		});
	}
}