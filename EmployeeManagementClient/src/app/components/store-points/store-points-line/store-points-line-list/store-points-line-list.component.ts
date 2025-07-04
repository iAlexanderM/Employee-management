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
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './store-points-line-list.component.html',
	styleUrls: ['./store-points-line-list.component.css']
})
export class StorePointsLineListComponent implements OnInit, OnDestroy {
	lines: Line[] = [];
	displayedLines: Line[] = [];
	searchForm: FormGroup;
	isSearchMode = false;
	isExpanded = false;
	currentPage = 1;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
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
		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe(value => {
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
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}

	loadLines(): void {
		this.isSearchMode = false;
		this.storePointsService.getLines(this.currentPage, this.pageSize).subscribe({
			next: (response) => {
				this.lines = response.lines || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedLines = this.lines;
			},
			error: (err) => {
				console.error('[loadLines] Error:', err);
				this.lines = [];
				this.displayedLines = [];
			}
		});
	}

	searchLines(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();
		this.storePointsService.searchLines(criteria).subscribe({
			next: (response) => {
				this.lines = response.lines || [];
				this.totalItems = response.total || this.lines.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedLines();
			},
			error: (err) => {
				console.error('[searchLines] Error:', err);
				this.lines = [];
				this.displayedLines = [];
			}
		});
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const rawValues = this.searchForm.value;
		const criteria = Object.entries(rawValues)
			.filter(([_, val]) => val !== null && val !== '')
			.reduce<{ [key: string]: any }>((acc, [key, val]) => {
				if (key === 'Id') {
					const parsed = parseInt(val as string, 10);
					if (!isNaN(parsed)) acc[key] = parsed;
				} else {
					acc[key] = (val as string).trim();
				}
				return acc;
			}, {});
		return criteria;
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.loadLines();
	}

	updateDisplayedLines(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedLines = this.lines.slice(startIndex, endIndex);
	}

	goToPage(page: number | string): void {
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
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const totalVisiblePages = 7;
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
	}

	editLine(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/line/edit`, id]);
		}
	}

	addLine(): void {
		this.router.navigate(['/line/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewLineDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/line/details/${id}`;
			window.open(url, '_blank');
		}
	}
}