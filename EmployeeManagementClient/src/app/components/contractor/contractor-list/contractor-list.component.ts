import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Contractor, ContractorDto } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Subscription, Observable } from 'rxjs';
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
	selector: 'app-contractor-list',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		CommonModule,
		RouterModule,
		NgxMaskDirective,
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
	providers: [provideNgxMask()],
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit, OnDestroy {
	allContractors: Contractor[] = [];
	displayedContractors: Contractor[] = [];
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	isSearchMode = false;
	isExpanded = false;
	isLoading = false;
	activeFilters: { [key: string]: any } = {};
	showArchived = false;

	searchForm: FormGroup;
	private subscriptions: Subscription[] = [];

	constructor(
		private contractorService: ContractorWatchService,
		private router: Router,
		private fb: FormBuilder,
		private snackBar: MatSnackBar
	) {
		this.searchForm = this.fb.group({
			Id: ['', Validators.pattern(/^\d+$/)],
			FirstName: [''],
			LastName: [''],
			MiddleName: [''],
			BirthDate: [''],
			DocumentType: [''],
			PassportSerialNumber: [''],
			PassportIssuedBy: [''],
			PassportIssueDate: [''],
			PhoneNumber: [''],
		});
	}

	ngOnInit(): void {
		this.loadContractors();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
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
					console.log('[loadContractors - Search] Ответ сервера:', response);
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
					console.error('[loadContractors - Search] Ошибка:', err);
					this.snackBar.open('Ошибка при поиске контрагентов', 'Закрыть', { duration: 5000 });
					this.allContractors = [];
					this.displayedContractors = [];
					this.totalItems = 0;
					this.totalPages = 0;
					this.visiblePages = [];
				},
			});
		} else {
			const params = {
				Page: this.currentPage,
				PageSize: this.pageSize,
				IsArchived: this.showArchived,
				...this.activeFilters,
			};

			console.log('[loadContractors - Server] Параметры запроса:', params);
			this.isLoading = true;

			this.contractorService.getContractors(params).subscribe({
				next: (response: { Contractors: Contractor[]; Total: number }) => {
					this.isLoading = false;
					console.log('[loadContractors - Server] Ответ сервера:', response);

					if (response && Array.isArray(response.Contractors)) {
						this.displayedContractors = response.Contractors.map((contractor) =>
							this.normalizePhotos(contractor)
						);
						this.totalItems = response.Total || this.displayedContractors.length;
						this.totalPages = Math.ceil(this.totalItems / this.pageSize);
						this.updateVisiblePages();
						console.log(
							'[loadContractors - Server] Отображаемые контрагенты:',
							this.displayedContractors
						);
					} else {
						console.error('[loadContractors - Server] Некорректный ответ сервера:', response);
						this.resetPagination();
					}
				},
				error: (err) => {
					this.isLoading = false;
					console.error('[loadContractors - Server] Ошибка:', err);
					this.snackBar.open('Ошибка при загрузке контрагентов', 'Закрыть', { duration: 5000 });
					this.resetPagination();
				},
			});
		}
	}

	private setDisplayedContractors(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedContractors = this.allContractors.slice(startIndex, endIndex);
		console.log('[setDisplayedContractors] Отображаемые контрагенты:', this.displayedContractors);
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		this.updateVisiblePages();

		if (this.isSearchMode) {
			this.setDisplayedContractors();
		} else {
			this.loadContractors();
		}
	}

	onPageClick(page: number | string): void {
		if (page === '...') return;
		this.goToPage(page as number);
	}

	onPageSizeChange(event: any): void {
		const newSize = parseInt(event.value, 10);
		if (!isNaN(newSize)) {
			this.pageSize = newSize;
			this.currentPage = 1;
			this.totalPages = this.isSearchMode
				? Math.ceil(this.allContractors.length / this.pageSize)
				: Math.ceil(this.totalItems / this.pageSize);

			console.log(`[onPageSizeChange] Размер страницы изменен на ${this.pageSize}, перезагружаем данные.`);

			if (this.isSearchMode) {
				this.setDisplayedContractors();
			} else {
				this.loadContractors();
			}
		}
	}

	searchContractors(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.loadContractors(true);
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = {};
		Object.keys(this.searchForm.value).forEach((key) => {
			const value = this.searchForm.get(key)?.value;
			if (value !== null && value !== '') {
				criteria[key] = key === 'Id' ? parseInt(value, 10) : value.trim();
			}
		});
		console.log('[prepareSearchCriteria] Сформированные критерии:', criteria);
		return criteria;
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.activeFilters = {};
		this.showArchived = false;
		this.loadContractors();
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
		console.log('[updateVisiblePages] Видимые страницы:', this.visiblePages);
	}

	normalizePhotos(contractor: Contractor): Contractor {
		contractor.photos = Array.isArray(contractor.photos) ? contractor.photos : [];
		return contractor;
	}

	getLatestNonDocumentPhoto(contractor: Contractor): string | null {
		if (contractor.photos && contractor.photos.length > 0) {
			const nonDocumentPhotos = contractor.photos
				.filter(photo => !photo.isDocumentPhoto)
				.sort((a, b) => b.id - a.id);
			const latestPhoto = nonDocumentPhotos[0];
			if (latestPhoto && latestPhoto.filePath) {
				const filePath = latestPhoto.filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
				const fullPath = `http://localhost:8080/${filePath}`;
				return fullPath;
			}
		}
		return null;
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	navigateToDetails(id: number): void {
		this.router.navigate(['/contractors/details', id]);
	}

	navigateToEdit(id: number): void {
		this.router.navigate(['/contractors/edit', id]);
	}

	toggleArchiveStatus(contractor: Contractor): void {
		this.isLoading = true;
		const action = contractor.isArchived
			? this.contractorService.unarchiveContractor(contractor.id)
			: this.contractorService.archiveContractor(contractor.id);

		action.subscribe({
			next: () => {
				this.isLoading = false;
				contractor.isArchived = !contractor.isArchived;
				const message = contractor.isArchived ? 'Контрагент архивирован' : 'Контрагент разархивирован';
				this.snackBar.open(message, 'Закрыть', { duration: 3000 });
				console.log(`[toggleArchiveStatus] ${message}, ID: ${contractor.id}`);
				this.loadContractors(this.isSearchMode);
			},
			error: (err: any) => {
				this.isLoading = false;
				const errorMessage = err.message || 'Произошла ошибка';
				this.snackBar.open(`Ошибка: ${errorMessage}`, 'Закрыть', { duration: 5000 });
				console.error('[toggleArchiveStatus] Ошибка:', err);
			},
		});
	}

	private resetPagination(): void {
		this.allContractors = [];
		this.displayedContractors = [];
		this.totalItems = 0;
		this.totalPages = 0;
		this.visiblePages = [];
	}

	toggleArchived(): void {
		this.showArchived = !this.showArchived;
		this.currentPage = 1;
		this.loadContractors();
	}
}