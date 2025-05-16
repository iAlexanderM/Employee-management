import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorePointsService } from '../../../../services/store-points.service';
import { Building } from '../../../../models/store-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-store-points-building-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './store-points-building-list.component.html',
	styleUrls: ['./store-points-building-list.component.css']
})
export class StorePointsBuildingListComponent implements OnInit, OnDestroy {
	buildings: Building[] = [];
	displayedBuildings: Building[] = [];
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
						this.updateDisplayedBuildings();
					} else {
						this.loadBuildings();
					}
				}
			})
		);
		this.loadBuildings();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}

	loadBuildings(): void {
		this.isSearchMode = false;
		this.storePointsService.getBuildings(this.currentPage, this.pageSize).subscribe({
			next: (response) => {
				console.log('[loadBuildings] Response:', response);
				this.buildings = response.buildings || [];
				console.log('[loadBuildings] Buildings:', this.buildings);
				this.totalItems = response.total || 0;
				console.log('[loadBuildings] Total Items:', this.totalItems);
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedBuildings = this.buildings;
				console.log('[loadBuildings] Displayed Buildings:', this.displayedBuildings);
			},
			error: (err) => {
				console.error('[loadBuildings] Error:', err);
				this.buildings = [];
				this.displayedBuildings = [];
			}
		});
	}

	searchBuildings(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();
		this.storePointsService.searchBuildings(criteria).subscribe({
			next: (response) => {
				this.buildings = response.buildings || [];
				this.totalItems = response.total || this.buildings.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedBuildings();
			},
			error: (err) => {
				console.error('[searchBuildings] Error:', err);
				this.buildings = [];
				this.displayedBuildings = [];
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
		this.loadBuildings();
	}

	updateDisplayedBuildings(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedBuildings = this.buildings.slice(startIndex, endIndex);
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;
		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedBuildings();
		} else {
			this.loadBuildings();
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

	editBuilding(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/building/edit`, id]);
		}
	}

	addBuilding(): void {
		this.router.navigate(['/building/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewBuildingDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/building/details/${id}`;
			window.open(url, '_blank');
		}
	}
}