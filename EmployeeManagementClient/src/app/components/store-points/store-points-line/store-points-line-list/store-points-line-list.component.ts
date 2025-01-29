import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Line } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-line-list',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule
	],
	templateUrl: './store-points-line-list.component.html',
	styleUrls: ['./store-points-line-list.component.css']
})
export class StorePointsLineListComponent implements OnInit, OnDestroy {
	lines: Line[] = [];
	displayedLines: Line[] = [];

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
		private storePointsService: StorePointsService,
		private fb: FormBuilder,
		private router: Router
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});
	}

	ngOnInit(): void {
		console.log('[ngOnInit] StorePointsLineListComponent init.');

		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe((value) => {
				console.log('[pageSizeControl.valueChanges] value:', value);
				const newSize = Number(value);
				if (!isNaN(newSize) && newSize > 0) {
					this.pageSize = newSize;
					this.currentPage = 1;
					this.calculateTotalPages();
					this.updateVisiblePages();

					if (this.isSearchMode) {
						this.updateDisplayedLines();
					} else {
						this.loadLines();
					}
				}
			})
		);

		this.loadLines();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((s) => s.unsubscribe());
	}

	// Серверная пагинация
	loadLines(): void {
		this.isSearchMode = false;
		const criteria = {};
		console.log('[loadLines] server pagination, page=', this.currentPage, 'pageSize=', this.pageSize);

		this.storePointsService.getLines(this.currentPage, this.pageSize, criteria).subscribe({
			next: (response) => {
				console.log('[loadLines] response:', response);

				this.lines = response.lines || [];
				this.totalItems = response.total || 0;

				console.log('[loadLines] after parse:', {
					linesCount: this.lines.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedLines = this.lines;
			},
			error: (err) => {
				console.error('[loadLines] error:', err);
				this.lines = [];
				this.displayedLines = [];
			}
		});
	}

	// Поиск (клиентская пагинация)
	searchLines(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();

		console.log('[searchLines] client pagination, criteria:', criteria);

		this.storePointsService.searchLines(criteria).subscribe({
			next: (response) => {
				console.log('[searchLines] response:', response);

				this.lines = response.lines || [];
				this.totalItems = this.lines.length;

				console.log('[searchLines] after parse:', {
					linesCount: this.lines.length,
					totalItems: this.totalItems
				});

				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedLines();
			},
			error: (err) => {
				console.error('[searchLines] error:', err);
				this.lines = [];
				this.displayedLines = [];
			}
		});
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const rawValues = this.searchForm.value;
		console.log('[prepareSearchCriteria] raw:', rawValues);

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

		console.log('[prepareSearchCriteria] result:', criteria);
		return criteria;
	}

	resetFilters(): void {
		console.log('[resetFilters]');
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadLines();
	}

	updateDisplayedLines(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedLines = this.lines.slice(startIndex, endIndex);
	}

	goToPage(page: number | string): void {
		console.log('[goToPage] page=', page);
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedLines();
		} else {
			this.loadLines();
		}
		this.updateVisiblePages();
	}

	onPageClick(page: number | string): void {
		console.log('[onPageClick] page=', page);
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
		console.log('[calculateTotalPages]', { totalItems: this.totalItems, pageSize: this.pageSize, totalPages: this.totalPages });
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const totalVisible = 7;

		if (this.totalPages <= totalVisible) {
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
		console.log('[updateVisiblePages]', pages);
	}

	editLine(id: number | undefined): void {
		console.log('[editLine] id=', id);
		if (id !== undefined) {
			this.router.navigate([`/line/edit`, id]);
		}
	}

	addLine(): void {
		console.log('[addLine]');
		this.router.navigate(['/line/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
		console.log('[toggleSearchForm] isExpanded=', this.isExpanded);
	}

	viewLineDetailsInNewTab(id: number | undefined): void {
		console.log('[viewLineDetailsInNewTab] id=', id);
		if (id !== undefined) {
			const url = `/line/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
