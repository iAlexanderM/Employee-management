import { Component, OnInit, OnDestroy, Output, EventEmitter, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PassGroupTypeService } from '../../../services/pass-group-type.service';
import { PassType } from '../../../models/pass-type.model';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface PassGroup {
	id: number;
	name: string;
	color: string;
}

@Component({
	selector: 'app-pass-type-modal',
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
		MatSnackBarModule,
		MatProgressSpinnerModule,
	],
	templateUrl: './pass-type-modal.component.html',
	styleUrls: ['./pass-type-modal.component.css']
})
export class PassTypeModalComponent implements OnInit, OnDestroy {
	@Output() modalClose = new EventEmitter<void>();
	@Output() itemSelected = new EventEmitter<PassType>();

	searchForm: FormGroup;
	passGroups: PassGroup[] = [];
	passTypes: PassType[] = [];
	displayedPassTypes: PassType[] = [];
	selectedGroup: PassGroup | null = null;
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	errorMessage: string = '';
	isLoading = false;

	private loadGroupsSubscription: Subscription | null = null;
	private loadTypesSubscription: Subscription | null = null;
	private searchTypesSubscription: Subscription | null = null;

	constructor(
		private fb: FormBuilder,
		private service: PassGroupTypeService,
		private snackBar: MatSnackBar,
		private renderer: Renderer2,
		private el: ElementRef
	) {
		this.searchForm = this.fb.group({
			id: ['', [Validators.pattern(/^[0-9]*$/)]],
			name: [''],
		});
	}

	ngOnInit(): void {
		this.renderer.appendChild(document.body, this.el.nativeElement);
		this.loadPassGroups();
	}

	ngOnDestroy(): void {
		if (this.loadGroupsSubscription) {
			this.loadGroupsSubscription.unsubscribe();
		}
		if (this.loadTypesSubscription) {
			this.loadTypesSubscription.unsubscribe();
		}
		if (this.searchTypesSubscription) {
			this.searchTypesSubscription.unsubscribe();
		}
		this.renderer.removeChild(document.body, this.el.nativeElement);
	}

	closeModal(): void {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}

	selectPassGroup(group: PassGroup): void {
		this.selectedGroup = group;
		this.searchForm.reset({ id: '', name: '' });
		this.loadPassTypes();
	}

	selectPassType(passType: PassType): void {
		this.itemSelected.emit(passType);
		this.closeModal();
	}

	loadPassGroups(): void {
		this.isLoading = true;
		this.loadGroupsSubscription = this.service.getGroups()
			.pipe(take(1))
			.subscribe({
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
					this.snackBar.open('Ошибка загрузки групп пропусков', 'Закрыть', { duration: 3000 });
				},
			});
	}

	loadPassTypes(): void {
		const groupId = this.selectedGroup!.id;
		this.isLoading = true;
		this.loadTypesSubscription = this.service.getTypes(groupId)
			.pipe(take(1))
			.subscribe({
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
					this.snackBar.open('Ошибка загрузки типов пропусков', 'Закрыть', { duration: 3000 });
				},
			});
	}

	searchPassTypes(): void {
		const formValue = this.searchForm.value;
		const id = formValue.id !== '' ? formValue.id : undefined;
		const name = formValue.name ? formValue.name.trim() : undefined;

		if (!this.selectedGroup) {
			this.snackBar.open('Сначала выберите группу пропусков', 'Закрыть', { duration: 3000 });
			return;
		}

		this.isLoading = true;
		this.searchTypesSubscription = this.service.getTypes(this.selectedGroup.id)
			.pipe(take(1))
			.subscribe({
				next: (data) => {
					this.isLoading = false;
					this.passTypes = data.filter((passType: PassType) => {
						const matchesId = id ? passType.id.toString() === id : true;
						const matchesName = name ? passType.name.toLowerCase().includes(name.toLowerCase()) : true;
						return matchesId && matchesName;
					});
					this.totalItems = this.passTypes.length;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.currentPage = 1;
					this.updateVisiblePages();
					this.setDisplayedPassTypes();
				},
				error: (err) => {
					this.isLoading = false;
					console.error('Ошибка при поиске типов пропусков:', err);
					this.snackBar.open('Ошибка при поиске типов пропусков', 'Закрыть', { duration: 3000 });
				},
			});
	}

	resetFilters(): void {
		this.searchForm.reset({ id: '', name: '' });
		if (this.selectedGroup) {
			this.loadPassTypes();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	goToPage(page: number): void {
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
			if (this.selectedGroup) {
				this.setDisplayedPassTypes();
			} else {
				this.loadPassGroups();
			}
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

	goBackToGroups(): void {
		this.selectedGroup = null;
		this.passTypes = [];
		this.displayedPassTypes = [];
		this.currentPage = 1;
		this.searchForm.reset({ id: '', name: '' });
		this.loadPassGroups();
	}

	isDarkBackground(color: string | undefined): boolean {
		if (!color) return true;

		const hex = color.replace('#', '');
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
		return luminance > 0.5;
	}
}