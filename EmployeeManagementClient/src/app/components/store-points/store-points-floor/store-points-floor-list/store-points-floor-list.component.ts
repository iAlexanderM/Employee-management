import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Floor } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-store-points-floor-list',
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './store-points-floor-list.component.html',
    styleUrls: ['./store-points-floor-list.component.css']
})
export class StorePointsFloorListComponent implements OnInit, OnDestroy {
	floors: Floor[] = [];
	displayedFloors: Floor[] = [];
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
						this.updateDisplayedFloors();
					} else {
						this.loadFloors();
					}
				}
			})
		);
		this.loadFloors();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}

	loadFloors(): void {
		this.isSearchMode = false;
		this.storePointsService.getFloors(this.currentPage, this.pageSize).subscribe({
			next: (response) => {
				this.floors = response.floors || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedFloors = this.floors;
			},
			error: (err) => {
				console.error('[loadFloors] Error:', err);
				this.floors = [];
				this.displayedFloors = [];
			}
		});
	}

	searchFloors(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();
		this.storePointsService.searchFloors(criteria).subscribe({
			next: (response) => {
				this.floors = response.floors || [];
				this.totalItems = response.total || this.floors.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedFloors();
			},
			error: (err) => {
				console.error('[searchFloors] Error:', err);
				this.floors = [];
				this.displayedFloors = [];
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
		this.loadFloors();
	}

	updateDisplayedFloors(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedFloors = this.floors.slice(startIndex, endIndex);
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;
		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedFloors();
		} else {
			this.loadFloors();
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

	editFloor(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/floor/edit`, id]);
		}
	}

	addFloor(): void {
		this.router.navigate(['/floor/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewFloorDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/floor/details/${id}`;
			window.open(url, '_blank');
		}
	}
}