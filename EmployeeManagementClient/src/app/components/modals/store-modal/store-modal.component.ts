import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
    selector: 'app-store-select-or-add-modal',
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatTableModule,
    ],
    templateUrl: './store-modal.component.html',
    styleUrls: ['./store-modal.component.css']
})
export class StoreModalComponent implements OnInit, OnDestroy {
	@Input() fieldName: 'building' | 'floor' | 'line' | 'storeNumber' = 'storeNumber';
	@Input() mode: 'select' | 'add' = 'select';
	@Output() modalClose = new EventEmitter<void>();
	@Output() itemSelected = new EventEmitter<Store>();

	currentPage = 1;
	pageSize = 25;
	totalItems: number = 0;
	totalPages: number = 0;
	items: Store[] = [];
	allStores: Store[] = [];
	searchForm: FormGroup;
	addForm: FormGroup; // Добавлено для режима добавления
	newItemName: string = '';
	errorMessage: string = '';
	visiblePages: (number | string)[] = [];
	pageSizeOptions: number[] = [25, 50, 100];
	isSearchMode = false;
	pageSizeControl: FormControl;

	private subscriptions: Subscription[] = [];

	constructor(
		private storeService: StoreService,
		private fb: FormBuilder
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: ['']
		});

		this.pageSizeControl = this.fb.control(this.pageSize);

		// Инициализация addForm для режима добавления
		this.addForm = this.fb.group({
			newItemName: ['']
		});
	}

	get fieldNameTranslated(): string {
		switch (this.fieldName) {
			case 'building':
				return 'Здание';
			case 'floor':
				return 'Этаж';
			case 'line':
				return 'Линия';
			case 'storeNumber':
				return 'Торговая точка';
			default:
				return this.fieldName;
		}
	}

	ngOnInit() {
		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe((value: string | number) => {
				const newSize = Number(value);
				if (!isNaN(newSize) && newSize > 0) {
					this.pageSize = newSize;
					this.onPageSizeChange();
				}
			})
		);

		if (this.mode === 'select') {
			this.loadItems();
		}
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(s => s.unsubscribe());
	}

	closeModal() {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	loadItems(): void {
		const criteria = this.prepareSearchCriteria();

		if (this.isSearchMode) {
			this.storeService.searchAllStores(criteria).subscribe({
				next: (stores: Store[]) => {
					this.allStores = stores;
					this.totalItems = stores.length;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.setDisplayedStores();
				},
				error: (err: any) => {
					console.error('Ошибка загрузки магазинов:', err);
					this.errorMessage = 'Ошибка загрузки магазинов.';
				}
			});
		} else {
			this.storeService.getStores(this.currentPage, this.pageSize, criteria).subscribe({
				next: (data: { stores: Store[]; total: number }) => {
					this.items = data.stores;
					this.totalItems = data.total;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
				},
				error: (err: any) => {
					console.error('Ошибка загрузки магазинов:', err);
					this.errorMessage = 'Ошибка загрузки магазинов.';
				}
			});
		}
	}

	searchStores(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.loadItems();
	}

	selectStore(store: Store): void {
		this.itemSelected.emit(store);
		this.closeModal();
	}

	addItem(): void {
		if (this.addForm.invalid) {
			this.errorMessage = 'Название не может быть пустым';
			return;
		}

		const newItemName = this.addForm.get('newItemName')?.value.trim();
		if (!newItemName) {
			this.errorMessage = 'Название не может быть пустым';
			return;
		}

		this.storeService.createStore(newItemName).subscribe({
			next: (response: Store) => {
				this.itemSelected.emit(response);
				this.closeModal();
			},
			error: (err: any) => {
				console.error('Ошибка добавления магазина:', err);
				this.errorMessage = 'Ошибка добавления магазина.';
			}
		});
	}

	private prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = {};
		const formValue = this.searchForm.value;

		if (formValue['Id']) {
			criteria['Id'] = parseInt(formValue['Id'], 10);
		}
		if (formValue['Building']) {
			criteria['Building'] = formValue['Building'].trim();
		}
		if (formValue['Floor']) {
			criteria['Floor'] = formValue['Floor'].trim();
		}
		if (formValue['Line']) {
			criteria['Line'] = formValue['Line'].trim();
		}
		if (formValue['StoreNumber']) {
			criteria['StoreNumber'] = formValue['StoreNumber'].trim();
		}

		return criteria;
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.totalPages = this.isSearchMode
			? Math.ceil(this.allStores.length / this.pageSize)
			: Math.ceil(this.totalItems / this.pageSize);
		this.updateVisiblePages();

		if (this.isSearchMode) {
			this.setDisplayedStores();
		} else {
			this.loadItems();
		}
	}

	goToPage(page: number): void {
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
			if (this.isSearchMode) {
				this.setDisplayedStores();
			} else {
				this.loadItems();
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

	private setDisplayedStores(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.items = this.allStores.slice(startIndex, endIndex);
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.pageSizeControl.setValue(this.pageSizeOptions[0]);
		this.loadItems();
	}
}