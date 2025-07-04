import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Contractor } from '../../../models/contractor.model';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
	selector: 'app-contractor-select-modal',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		MatTableModule,
		MatSelectModule,
		MatIconModule,
		MatSnackBarModule
	],
	templateUrl: './contractor-modal.component.html',
	styleUrls: ['./contractor-modal.component.css']
})
export class ContractorModalComponent implements OnInit, OnDestroy {
	@Input() mode: 'select' | 'add' = 'select';
	@Output() modalClose = new EventEmitter();
	@Output() itemSelected = new EventEmitter<Contractor>();

	searchForm: FormGroup;
	allContractors: Contractor[] = [];
	displayedContractors: Contractor[] = [];
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	errorMessage: string = '';

	isSearchMode = false;
	isExpanded = false;
	isLoading = false;

	activeFilters: { [key: string]: any } = {};

	private subscriptions: Subscription[] = [];

	constructor(
		private contractorService: ContractorWatchService,
		private fb: FormBuilder,
		private router: Router
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			LastName: [''],
			FirstName: [''],
			MiddleName: [''],
			BirthDate: [''],
			PassportSerialNumber: [''],
		});
	}

	ngOnInit(): void {
		if (this.mode === 'select') {
			this.loadContractors();
		}
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	closeModal(): void {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}

	searchContractors(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.loadContractors(true);
	}

	selectContractor(contractor: Contractor): void {
		this.itemSelected.emit(contractor);
		this.closeModal();
	}

	loadContractors(isSearch: boolean = false): void {
		if (isSearch) {
			this.isSearchMode = true;
			this.currentPage = 1;
			this.activeFilters = this.prepareSearchCriteria();
		} else {
			this.isSearchMode = false;
			this.activeFilters = {};
		}

		if (this.isSearchMode) {
			this.isLoading = true;
			this.contractorService.searchContractors(this.activeFilters).subscribe({
				next: (response: { Contractors: Contractor[]; Total: number }) => {
					this.isLoading = false;
					this.allContractors = response.Contractors.map((contractor) =>
						this.normalizePhotos(contractor)
					);
					this.totalItems = response.Total;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.setDisplayedContractors();
				},
				error: (err) => {
					this.isLoading = false;
					this.allContractors = [];
					this.displayedContractors = [];
					this.totalItems = 0;
					this.totalPages = 0;
					this.visiblePages = [];
					this.errorMessage = 'Ошибка при загрузке контрагентов.';
				},
			});
		} else {
			const params = {
				Page: this.currentPage,
				PageSize: this.pageSize,
				IsArchived: false, // Фильтр только неархивированных контрагентов
				...this.activeFilters,
			};

			this.isLoading = true;

			this.contractorService.getContractors(params).subscribe({
				next: (response: { Contractors: Contractor[]; Total: number }) => {
					this.isLoading = false;

					if (response && Array.isArray(response.Contractors)) {
						this.displayedContractors = response.Contractors.map((contractor) =>
							this.normalizePhotos(contractor)
						);
						this.totalItems = response.Total || this.displayedContractors.length;
						this.totalPages = Math.ceil(this.totalItems / this.pageSize);
						this.updateVisiblePages();
					} else {
						this.resetPagination();
					}
				},
				error: (err) => {
					this.isLoading = false;
					this.resetPagination();
					this.errorMessage = 'Ошибка при загрузке контрагентов.';
				},
			});
		}
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = { IsArchived: false }; // Фильтр только неархивированных в поиске
		const formValue = this.searchForm.value;

		if (formValue['Id']) {
			criteria['Id'] = parseInt(formValue['Id'], 10);
		}
		if (formValue['LastName']) {
			criteria['LastName'] = formValue['LastName'].trim();
		}
		if (formValue['FirstName']) {
			criteria['FirstName'] = formValue['FirstName'].trim();
		}
		if (formValue['MiddleName']) {
			criteria['MiddleName'] = formValue['MiddleName'].trim();
		}
		if (formValue['BirthDate']) {
			criteria['BirthDate'] = formValue['BirthDate'];
		}
		if (formValue['PassportSerialNumber']) {
			criteria['PassportSerialNumber'] = formValue['PassportSerialNumber'].trim();
		}

		return criteria;
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	goToPage(page: number): void {
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
			this.loadContractors();
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

	private setDisplayedContractors(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedContractors = this.allContractors.slice(startIndex, endIndex);
	}

	getFirstPhoto(contractor: Contractor): string | null {
		if (contractor.photos && contractor.photos.length > 0) {
			const photo = contractor.photos[0];
			if (photo && photo.filePath) {
				const filePath = photo.filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
				const fullPath = `http://localhost:8080/${filePath}`;
				return fullPath;
			}
		}
		return null;
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.loadContractors();
	}

	navigateToDetails(id: number): void {
		this.router.navigate(['/contractors/details', id]);
	}

	navigateToEdit(id: number): void {
		this.router.navigate(['/contractors/edit', id]);
	}

	private resetPagination(): void {
		this.allContractors = [];
		this.displayedContractors = [];
		this.totalItems = 0;
		this.totalPages = 0;
		this.visiblePages = [];
	}

	normalizePhotos(contractor: Contractor): Contractor {
		contractor.photos = Array.isArray(contractor.photos) ? contractor.photos : [];
		return contractor;
	}
}