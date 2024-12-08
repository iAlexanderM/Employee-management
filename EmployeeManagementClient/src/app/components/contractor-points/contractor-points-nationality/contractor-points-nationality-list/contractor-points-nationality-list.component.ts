import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Nationality } from '../../../../models/contractor-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-contractor-points-nationality-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
	templateUrl: './contractor-points-nationality-list.component.html',
	styleUrls: ['./contractor-points-nationality-list.component.css']
})
export class ContractorPointsNationalityListComponent implements OnInit, OnDestroy {
	nationalities: Nationality[] = [];
	displayedNationalities: Nationality[] = [];
	searchForm: FormGroup;
	isSearchMode = false; // Флаг, указывающий, выполняется ли поиск
	currentPage: number = 1;
	pageSize: number = 25;
	totalPages: number = 0;
	totalItems: number = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions: number[] = [25, 50, 100];
	isExpanded = false;

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
		this.loadNationalities(); // Загружаем данные при входе на страницу
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	// Обычная загрузка с серверной пагинацией
	loadNationalities(): void {
		this.isSearchMode = false; // Выключаем режим поиска
		this.contractorPointsService.getNationalities(this.currentPage, this.pageSize, this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.nationalities = response.nationalities || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedNationalities = this.nationalities;
			},
			error: (err) => {
				console.error('[loadNationalities] Ошибка загрузки данных:', err);
				this.nationalities = [];
				this.displayedNationalities = [];
			},
		});
	}

	// Поиск без серверной пагинации
	searchNationalities(): void {
		this.isSearchMode = true;
		this.currentPage = 1; // При поиске начинаем с 1-й страницы
		this.contractorPointsService.searchNationalities(this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.nationalities = response.nationalities || [];
				this.totalItems = this.nationalities.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedNationalities(); // Локальная нарезка для текущей страницы при поиске
			},
			error: (err) => {
				console.error('[searchNationalities] Ошибка выполнения поиска:', err);
				this.nationalities = [];
				this.displayedNationalities = [];
			},
		});
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria = Object.entries(this.searchForm.value)
			.filter(([_, value]) => value !== null && value !== '')
			.reduce<{ [key: string]: any }>((acc, [key, value]) => {
				acc[key] = key === 'Id' ? parseInt(value as string, 10) : (value as string).trim();
				return acc;
			}, {});

		return criteria;
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadNationalities(); // Возвращаемся к обычному показу
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedNationalities();
		} else {
			this.loadNationalities();
		}
		this.updateVisiblePages();
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.updateDisplayedNationalities();
		} else {
			this.loadNationalities();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	updateDisplayedNationalities(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedNationalities = this.nationalities.slice(startIndex, endIndex);
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	updateVisiblePages(): void {
		const totalVisiblePages = 7;
		const pages: (number | string)[] = [];

		if (this.totalPages <= totalVisiblePages) {
			// Показываем все страницы
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

	editNationality(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/nationality/edit`, id]);
		}
	}

	addNationality(): void {
		this.router.navigate(['/nationality/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewNationalityDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/nationality/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
