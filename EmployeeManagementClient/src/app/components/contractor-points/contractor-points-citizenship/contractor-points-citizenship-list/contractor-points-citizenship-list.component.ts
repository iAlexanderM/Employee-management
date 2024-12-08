import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Citizenship } from '../../../../models/contractor-points.model';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-contractor-points-citizenship-list',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
	templateUrl: './contractor-points-citizenship-list.component.html',
	styleUrls: ['./contractor-points-citizenship-list.component.css']
})
export class ContractorPointsCitizenshipListComponent implements OnInit, OnDestroy {
	citizenships: Citizenship[] = [];
	displayedCitizenships: Citizenship[] = [];
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
		this.loadCitizenships(); // Загружаем данные при входе на страницу
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	// Обычная загрузка (серверная пагинация)
	loadCitizenships(): void {
		this.isSearchMode = false; // Выключаем режим поиска
		this.contractorPointsService.getCitizenships(this.currentPage, this.pageSize, this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.citizenships = response.citizenships || [];
				this.totalItems = response.total || 0;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.displayedCitizenships = this.citizenships;
			},
			error: (err) => {
				console.error('[loadCitizenships] Ошибка загрузки данных:', err);
				this.citizenships = [];
				this.displayedCitizenships = [];
			},
		});
	}

	// Поиск без серверной пагинации
	searchCitizenships(): void {
		this.isSearchMode = true; // Включаем режим поиска
		this.currentPage = 1; // Начинаем с 1-й страницы при поиске
		this.contractorPointsService.searchCitizenships(this.prepareSearchCriteria()).subscribe({
			next: (response) => {
				this.citizenships = response.citizenships || [];
				this.totalItems = this.citizenships.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedCitizenships(); // Локальная нарезка
			},
			error: (err) => {
				console.error('[searchCitizenships] Ошибка выполнения поиска:', err);
				this.citizenships = [];
				this.displayedCitizenships = [];
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

	updateDisplayedCitizenships(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedCitizenships = this.citizenships.slice(startIndex, endIndex);
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.currentPage = 1;
		this.loadCitizenships(); // Возвращаемся к обычному показу
	}

	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;
		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		if (this.isSearchMode) {
			this.updateDisplayedCitizenships();
		} else {
			this.loadCitizenships();
		}
		this.updateVisiblePages();
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.updateDisplayedCitizenships();
		} else {
			this.loadCitizenships();
		}
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

	editCitizenship(id: number | undefined): void {
		if (id !== undefined) {
			this.router.navigate([`/citizenship/edit`, id]);
		}
	}

	addCitizenship(): void {
		this.router.navigate(['/citizenship/new']);
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	viewCitizenshipDetailsInNewTab(id: number | undefined): void {
		if (id !== undefined) {
			const url = `/citizenship/details/${id}`;
			window.open(url, '_blank');
		}
	}
}
