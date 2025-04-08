import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PassGroupTypeService } from '../../../services/pass-group-type.service';
import { PassType } from '../../../models/pass-type.model';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-pass-type-modal',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './pass-type-modal.component.html',
	styleUrls: ['./pass-type-modal.component.css']
})
export class PassTypeModalComponent implements OnInit, OnDestroy {
	@Output() modalClose = new EventEmitter<void>();
	@Output() itemSelected = new EventEmitter<PassType>();

	searchForm: FormGroup;
	passGroups: any[] = [];
	passTypes: PassType[] = [];
	displayedPassTypes: PassType[] = [];
	selectedGroup: any = null;
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	errorMessage: string = '';

	isSearchMode = false;
	isLoading = false;

	activeFilters: { [key: string]: any } = {};
	private subscriptions: Subscription[] = [];

	constructor(
		private fb: FormBuilder,
		private service: PassGroupTypeService
	) {
		this.searchForm = this.fb.group({
			groupName: ['']
		});
	}

	ngOnInit(): void {
		this.loadPassGroups();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}

	closeModal(): void {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}

	selectPassGroup(group: any): void {
		this.selectedGroup = group;
		this.loadPassTypes();
	}

	selectPassType(passType: PassType): void {
		this.itemSelected.emit(passType);
		this.closeModal();
	}

	loadPassGroups(): void {
		this.isLoading = true;

		this.service.getGroups().subscribe({
			next: (response) => {
				this.isLoading = false;
				this.passGroups = Array.isArray(response) ? response : [];
				this.totalItems = this.passGroups.length;
				this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				this.updateVisiblePages();
			},
			error: (err) => {
				this.isLoading = false;
				this.resetPagination();
			}
		});
	}

	loadPassTypes(): void {
		const groupId = this.selectedGroup.id;

		this.isLoading = true;

		this.service.getTypes(groupId).subscribe({
			next: (response) => {
				this.isLoading = false;
				this.passTypes = response;
				this.totalItems = this.passTypes.length;
				this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				this.updateVisiblePages();
				this.setDisplayedPassTypes();
			},
			error: (err) => {
				this.isLoading = false;
				this.resetPagination();
			}
		});
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	goToPage(page: number): void {
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
			this.loadPassGroups();
			this.updateVisiblePages();
		}
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
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
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

	private setDisplayedPassTypes(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedPassTypes = this.passTypes.slice(startIndex, endIndex);
	}

	private resetPagination(): void {
		this.passGroups = [];
		this.passTypes = [];
		this.displayedPassTypes = [];
		this.totalItems = 0;
		this.totalPages = 0;
		this.visiblePages = [];
	}
}
