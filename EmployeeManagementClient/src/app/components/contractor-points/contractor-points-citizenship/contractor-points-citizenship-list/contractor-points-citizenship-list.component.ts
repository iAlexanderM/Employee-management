import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Citizenship } from '../../../../models/contractor-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-contractor-points-citizenship-list',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
	],
	templateUrl: './contractor-points-citizenship-list.component.html',
	styleUrls: ['./contractor-points-citizenship-list.component.css']
})
export class ContractorPointsCitizenshipListComponent implements OnInit, OnDestroy {

	citizenships: Citizenship[] = [];
	displayedCitizenships: Citizenship[] = [];

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
		console.log('[ngOnInit] ContractorPointsCitizenshipListComponent инициализировался.');

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
						this.updateDisplayedCitizenships();
					} else {
						this.loadCitizenships();
					}
				}
			})
		);

		this.loadCitizenships();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((s) => s.unsubscribe());
	}

	loadCitizenships(): void {
		this.isSearchMode = false;
		const criteria = this.prepareSearchCriteria();

		console.log('[loadCitizenships] (серверная пагинация) Параметры:', {
			currentPage: this.currentPage,
			pageSize: this.pageSize,
			criteria
		});

		this.contractorPointsService.getCitizenships(this.currentPage, this.pageSize, criteria).subscribe({
			next: (response) => {
				console.log('[loadCitizenships] Raw response from server:', response);

				this.citizenships = response.citizenships || [];
				this.totalItems = response.total || 0;

				console.log('[loadCitizenships] После парсинга:', {
					citizenshipsCount: this.citizenships.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedCitizenships = this.citizenships;

				console.log('[loadCitizenships] displayedCitizenships:', this.displayedCitizenships);
			},
			error: (err) => {
				console.error('[loadCitizenships] Ошибка загрузки данных:', err);
				this.citizenships = [];
				this.displayedCitizenships = [];
			}
		});
	}

	searchCitizenships(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();

		console.log('[searchCitizenships] (клиентская пагинация) Параметры поиска:', criteria);

		this.contractorPointsService.searchCitizenships(criteria).subscribe({
			next: (response) => {
				console.log('[searchCitizenships] Raw response from server:', response);
				this.citizenships = response.citizenships || [];
				this.totalItems = this.citizenships.length;

				console.log('[searchCitizenships] После парсинга:', {
					citizenshipsCount: this.citizenships.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();

				this.updateDisplayedCitizenships();

				console.log('[searchCitizenships] displayedCitizenships:', this.displayedCitizenships);
			},
			error: (err) => {
				console.error('[searchCitizenships] Ошибка выполнения поиска:', err);
				this.citizenships = [];
				this.displayedCitizenships = [];
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

	updateDisplayedCitizenships(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedCitizenships = this.citizenships.slice(startIndex, endIndex);
	}

	resetFilters(): void {
		console.log('[resetFilters] Сбрасываем форму и режим поиска');
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadCitizenships();
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
			this.updateDisplayedCitizenships();
		} else {
			this.loadCitizenships();
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
		console.log('[calculateTotalPages] totalItems =', this.totalItems, 'pageSize =', this.pageSize, '=> totalPages =', this.totalPages);
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

	editCitizenship(id: number | undefined): void {
		console.log('[editCitizenship] id=', id);
		if (id !== undefined) {
			this.router.navigate([`/citizenship/edit`, id]);
		}
	}

	addCitizenship(): void {
		console.log('[addCitizenship]');
		this.router.navigate(['/citizenship/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
		console.log('[toggleSearchForm] isExpanded=', this.isExpanded);
	}

	viewCitizenshipDetailsInNewTab(id: number | undefined): void {
		console.log('[viewCitizenshipDetailsInNewTab] id=', id);
		if (id !== undefined) {
			const url = `/citizenship/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
