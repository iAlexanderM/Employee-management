import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PositionService } from '../../../services/position.service';
import { Position } from '../../../models/position.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-position-list',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
	],
	templateUrl: './position-list.component.html',
	styleUrls: ['./position-list.component.css']
})
export class PositionListComponent implements OnInit, OnDestroy {

	positions: Position[] = [];
	displayedPositions: Position[] = [];

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
		private positionService: PositionService,
		private fb: FormBuilder,
		private router: Router
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});
	}

	ngOnInit(): void {
		console.log('[ngOnInit] PositionListComponent инициализировался.');

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
						this.updateDisplayedPositions();
					} else {
						this.loadPositions();
					}
				}
			})
		);

		this.loadPositions();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((s) => s.unsubscribe());
	}

	loadPositions(): void {
		this.isSearchMode = false;
		const criteria = this.prepareSearchCriteria();

		console.log('[loadPositions] (серверная пагинация) Параметры:', {
			currentPage: this.currentPage,
			pageSize: this.pageSize,
			criteria
		});

		this.positionService.getPositions(this.currentPage, this.pageSize, criteria).subscribe({
			next: (response) => {
				console.log('[loadPositions] Raw response from server:', response);

				this.positions = response.positions || [];
				this.totalItems = response.total || 0;

				console.log('[loadPositions] После парсинга:', {
					positionsCount: this.positions.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedPositions = this.positions;

				console.log('[loadPositions] displayedPositions:', this.displayedPositions);
			},
			error: (err) => {
				console.error('[loadPositions] Ошибка загрузки данных:', err);
				this.positions = [];
				this.displayedPositions = [];
			}
		});
	}

	searchPositions(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();

		console.log('[searchPositions] (клиентская пагинация) Параметры поиска:', criteria);

		this.positionService.searchPositions(criteria).subscribe({
			next: (response) => {
				console.log('[searchPositions] Raw response from server:', response);
				this.positions = response.positions || [];
				this.totalItems = this.positions.length;

				console.log('[searchPositions] После парсинга:', {
					positionsCount: this.positions.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();

				this.updateDisplayedPositions();

				console.log('[searchPositions] displayedPositions:', this.displayedPositions);
			},
			error: (err) => {
				console.error('[searchPositions] Ошибка выполнения поиска:', err);
				this.positions = [];
				this.displayedPositions = [];
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

	updateDisplayedPositions(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedPositions = this.positions.slice(startIndex, endIndex);
	}

	resetFilters(): void {
		console.log('[resetFilters] Сбрасываем форму и режим поиска');
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadPositions();
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
			this.updateDisplayedPositions();
		} else {
			this.loadPositions();
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

	editPosition(id: number | undefined): void {
		console.log('[editPosition] id=', id);
		if (id !== undefined) {
			this.router.navigate([`/positions/edit`, id]);
		}
	}

	addPosition(): void {
		console.log('[addPosition]');
		this.router.navigate(['/positions/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
		console.log('[toggleSearchForm] isExpanded=', this.isExpanded);
	}

	viewPositionDetailsInNewTab(id: number | undefined): void {
		console.log('[viewPositionDetailsInNewTab] id=', id);
		if (id !== undefined) {
			const url = `/positions/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
