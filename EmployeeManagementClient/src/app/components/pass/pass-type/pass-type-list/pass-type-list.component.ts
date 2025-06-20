import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	FormControl
} from '@angular/forms';
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
	selector: 'app-pass-type-list',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		ReactiveFormsModule,
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
	templateUrl: './pass-type-list.component.html',
	styleUrls: ['./pass-type-list.component.css'],
})
export class PassTypeListComponent implements OnInit {
	passTypes: PassType[] = [];
	displayedPassTypes: PassType[] = [];
	isLoading = false;
	isExpanded = false;
	groupId!: number;
	groupName!: string;
	searchForm: FormGroup;
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	pageSizeControl: FormControl<number>;
	visiblePages: (number | string)[] = [];

	constructor(
		private passGroupTypeService: PassGroupTypeService,
		private route: ActivatedRoute,
		private fb: FormBuilder
	) {
		this.searchForm = this.fb.group({
			id: [null],
			name: ['']
		});

		this.pageSizeControl = this.fb.control<number>(this.pageSize, { nonNullable: true });
	}

	ngOnInit(): void {
		this.pageSizeControl.valueChanges.subscribe((newValue) => {
			this.pageSize = newValue;
			this.onPageSizeChange();
		});

		this.route.queryParams.subscribe((params) => {
			this.groupId = +params['groupId'];
			this.groupName = params['groupName'];
			this.loadPassTypes();
		});
	}

	// Загрузка типов для конкретной группы
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
		const formValue = this.searchForm.value;
		const id = formValue.id !== null ? formValue.id : undefined;
		const name = formValue.name ? formValue.name.trim() : undefined;

		this.passGroupTypeService.searchPassTypes(id, name).subscribe({
			next: (data) => {
				this.passTypes = data;
				this.updatePagination();
			},
			error: (err) => console.error('Ошибка при поиске типов пропусков:', err),
		});
	}

	resetFilters(): void {
		this.searchForm.reset({ id: null, name: '' });
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
		const total = this.totalPages();
		const pages: (number | string)[] = [];
		const maxVisiblePages = 7;

		if (total <= maxVisiblePages) {
			for (let i = 1; i <= total; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(total);
			} else if (this.currentPage >= total - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = total - 4; i <= total; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(total);
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

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	totalPages(): number {
		return Math.ceil(this.passTypes.length / this.pageSize);
	}
}
