import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-pass-type-list',
	standalone: true,
	imports: [CommonModule, RouterModule, FormsModule],
	templateUrl: './pass-type-list.component.html',
	styleUrls: ['./pass-type-list.component.css'],
})
export class PassTypeListComponent implements OnInit {
	passTypes: PassType[] = [];
	displayedPassTypes: PassType[] = [];
	groupId!: number;
	groupName!: string;

	searchCriteria = { id: null, name: '' };

	currentPage = 1;
	pageSize = 25;
	pageSizeOptions = [25, 50, 100];
	visiblePages: (number | string)[] = [];

	constructor(
		private passGroupTypeService: PassGroupTypeService,
		private route: ActivatedRoute
	) { }

	ngOnInit(): void {
		this.route.queryParams.subscribe((params) => {
			this.groupId = +params['groupId'];
			this.groupName = params['groupName'];
			this.loadPassTypes();
		});
	}

	loadPassTypes(): void {
		this.passGroupTypeService.getTypes(this.groupId).subscribe({
			next: (data) => {
				this.passTypes = data;
				this.updatePagination();
			},
			error: (err) => console.error('Ошибка при загрузке типов пропусков:', err),
		});
	}

	searchPassTypes(): void {
		const id = this.searchCriteria.id !== null ? this.searchCriteria.id : undefined;
		const name = this.searchCriteria.name?.trim();

		this.passGroupTypeService.searchPassTypes(id, name).subscribe({
			next: (data) => {
				this.passTypes = data;
				this.updateDisplayedPassTypes();
			},
			error: (err) => console.error('Ошибка при поиске типов пропусков:', err),
		});
	}

	resetFilters(): void {
		this.searchCriteria = { id: null, name: '' };
		this.currentPage = 1;
		this.loadPassTypes();
	}

	updateDisplayedPassTypes(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedPassTypes = this.passTypes.slice(startIndex, endIndex);
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.updatePagination();
	}

	updatePagination(): void {
		this.updateDisplayedPassTypes();
		this.calculateVisiblePages();
	}

	calculateVisiblePages(): void {
		const totalPages = this.totalPages();
		const pages: (number | string)[] = [];
		const maxVisiblePages = 7; // Максимальное количество видимых страниц

		if (totalPages <= maxVisiblePages) {
			// Если страниц меньше или равно максимальному числу видимых
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Если текущая страница близка к началу
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(totalPages);
			}
			// Если текущая страница близка к концу
			else if (this.currentPage >= totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = totalPages - 4; i <= totalPages; i++) {
					pages.push(i);
				}
			}
			// Если текущая страница находится в середине
			else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(totalPages);
			}
		}

		this.visiblePages = pages;
	}

	onPageClick(page: number | string): void {
		if (typeof page === 'number' && page > 0 && page <= this.totalPages()) {
			this.currentPage = page;
			this.updateDisplayedPassTypes();
			this.calculateVisiblePages();
		}
	}

	totalPages(): number {
		return Math.ceil(this.passTypes.length / this.pageSize);
	}
}
