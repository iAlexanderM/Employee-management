import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Nationality } from '../../../../models/contractor-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
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
	selector: 'app-contractor-points-nationality-list',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		CommonModule,
		RouterModule,
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
	templateUrl: './contractor-points-nationality-list.component.html',
	styleUrls: ['./contractor-points-nationality-list.component.css']
})
export class ContractorPointsNationalityListComponent implements OnInit, OnDestroy {

	nationalities: Nationality[] = [];
	displayedNationalities: Nationality[] = [];

	searchForm: FormGroup;

	isSearchMode = false;
	isExpanded = false;

	currentPage: number = 1;
	pageSizeOptions: number[] = [25, 50, 100];
	pageSize: number = 25;

	totalItems: number = 0;
	totalPages: number = 0;
	visiblePages: (number | string)[] = [];

	pageSizeControl = new FormControl(this.pageSize);

	private subscriptions: Subscription[] = [];

	constructor(
		private contractorPointsService: ContractorPointsService,
		private fb: FormBuilder,
		private router: Router
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});
	}

	ngOnInit(): void {
		console.log('[ngOnInit] ContractorPointsNationalityListComponent инициализировался.');

		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe((value) => {
				console.log('[pageSizeControl.valueChanges] новое значение:', value);
				const newSize = Number(value);
				if (!isNaN(newSize) && newSize > 0) {
					this.pageSize = newSize;
					this.currentPage = 1;
					this.calculateTotalPages();
					this.updateVisiblePages();

					if (this.isSearchMode) {
						this.updateDisplayedNationalities();
					} else {
						this.loadNationalities();
					}
				}
			})
		);

		this.loadNationalities();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((s) => s.unsubscribe());
	}

	loadNationalities(): void {
		this.isSearchMode = false;
		const criteria = this.prepareSearchCriteria();

		console.log('[loadNationalities] (серверная пагинация) Параметры:', {
			currentPage: this.currentPage,
			pageSize: this.pageSize,
			criteria
		});

		this.contractorPointsService.getNationalities(this.currentPage, this.pageSize, criteria).subscribe({
			next: (response) => {
				console.log('[loadNationalities] Raw response from server:', response);
				this.nationalities = response.nationalities || [];
				this.totalItems = response.total || 0;

				console.log('[loadNationalities] После парсинга:', {
					nationalitiesCount: this.nationalities.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedNationalities = this.nationalities;

				console.log('[loadNationalities] displayedNationalities:', this.displayedNationalities);
			},
			error: (err) => {
				console.error('[loadNationalities] Ошибка загрузки данных:', err);
				this.nationalities = [];
				this.displayedNationalities = [];
			}
		});
	}

	searchNationalities(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();

		console.log('[searchNationalities] (клиентская пагинация) Параметры поиска:', criteria);

		this.contractorPointsService.searchNationalities(criteria).subscribe({
			next: (response) => {
				console.log('[searchNationalities] Raw response from server:', response);
				this.nationalities = response.nationalities || [];
				this.totalItems = this.nationalities.length;

				console.log('[searchNationalities] После парсинга:', {
					nationalitiesCount: this.nationalities.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();

				this.updateDisplayedNationalities();

				console.log('[searchNationalities] displayedNationalities:', this.displayedNationalities);
			},
			error: (err) => {
				console.error('[searchNationalities] Ошибка выполнения поиска:', err);
				this.nationalities = [];
				this.displayedNationalities = [];
			}
		});
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const rawValues = this.searchForm.value;
		console.log('[prepareSearchCriteria] raw form values:', rawValues);

		const criteria = Object.entries(rawValues)
			.filter(([_, val]) => val !== null && val !== '')
			.reduce<{ [key: string]: any }>((acc, [key, val]) => {
				if (key === 'Id') {
					const parsed = parseInt(val as string, 10);
					if (!isNaN(parsed)) {
						acc[key] = parsed;
					}
				} else {
					acc[key] = (val as string).trim();
				}
				return acc;
			}, {});

		console.log('[prepareSearchCriteria] итоговые критерии:', criteria);
		return criteria;
	}

	updateDisplayedNationalities(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedNationalities = this.nationalities.slice(startIndex, endIndex);
	}

	resetFilters(): void {
		console.log('[resetFilters] Сбрасываем форму и режим поиска');
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadNationalities();
	}

	goToPage(page: number | string): void {
		console.log('[goToPage] попытка перейти к странице:', page);

		if (typeof page !== 'number') {
			console.warn('[goToPage] page не число:', page);
			return;
		}
		if (page < 1 || page > this.totalPages) {
			console.warn('[goToPage] page вне диапазона:', page, 'totalPages:', this.totalPages);
			return;
		}

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedNationalities();
		} else {
			this.loadNationalities();
		}
		this.updateVisiblePages();
	}

	onPageClick(page: number | string): void {
		console.log('[onPageClick] click:', page);
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
		console.log('[calculateTotalPages] totalItems =', this.totalItems,
			'pageSize =', this.pageSize,
			'=> totalPages =', this.totalPages);
	}

	updateVisiblePages(): void {
		const totalVisiblePages = 7;
		const pages: (number | string)[] = [];

		if (this.totalPages <= totalVisiblePages) {
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 6; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(this.totalPages);
			}
		}

		this.visiblePages = pages;
		console.log('[updateVisiblePages] visiblePages:', pages);
	}

	editNationality(id: number | undefined): void {
		console.log('[editNationality] id=', id);
		if (id !== undefined) {
			this.router.navigate([`/nationality/edit`, id]);
		}
	}

	addNationality(): void {
		console.log('[addNationality]');
		this.router.navigate(['/nationality/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
		console.log('[toggleSearchForm] isExpanded=', this.isExpanded);
	}

	viewNationalityDetailsInNewTab(id: number | undefined): void {
		console.log('[viewNationalityDetailsInNewTab] id=', id);
		if (id !== undefined) {
			const url = `/nationality/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
