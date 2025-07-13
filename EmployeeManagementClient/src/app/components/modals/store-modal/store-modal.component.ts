import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
	selector: 'app-store-select-or-add-modal',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		MatTableModule,
		MatSnackBarModule
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
	addForm: FormGroup;
	errorMessage: string = '';
	visiblePages: (number | string)[] = [];
	pageSizeOptions: number[] = [25, 50, 100];
	isSearchMode = false;
	pageSizeControl: FormControl;

	private loadSubscription: Subscription | null = null;
	private searchSubscription: Subscription | null = null;
	private addSubscription: Subscription | null = null;
	private pageSizeSubscription: Subscription | null = null;

	constructor(
		private storeService: StoreService,
		private fb: FormBuilder,
		private renderer: Renderer2,
		private el: ElementRef,
		private snackBar: MatSnackBar
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			Building: [''],
			Floor: [''],
			Line: [''],
			StoreNumber: ['']
		});

		this.pageSizeControl = this.fb.control(this.pageSize);

		this.addForm = this.fb.group({
			newItemName: ['']
		});
	}

	get fieldNameTranslated(): string {
		switch (this.fieldName) {
			case 'building': return 'Здание';
			case 'floor': return 'Этаж';
			case 'line': return 'Линия';
			case 'storeNumber': return 'Торговая точка';
			default: return this.fieldName;
		}
	}

	ngOnInit(): void {
		this.renderer.appendChild(document.body, this.el.nativeElement);
		this.pageSizeSubscription = this.pageSizeControl.valueChanges.subscribe((value: string | number) => {
			const newSize = Number(value);
			if (!isNaN(newSize) && newSize > 0) {
				this.pageSize = newSize;
				this.onPageSizeChange();
			}
		});

		if (this.mode === 'select') {
			this.loadItems();
		}
	}

	ngOnDestroy(): void {
		if (this.loadSubscription) this.loadSubscription.unsubscribe();
		if (this.searchSubscription) this.searchSubscription.unsubscribe();
		if (this.addSubscription) this.addSubscription.unsubscribe();
		if (this.pageSizeSubscription) this.pageSizeSubscription.unsubscribe();
		this.renderer.removeChild(document.body, this.el.nativeElement);
	}

	closeModal(): void {
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
		this.loadSubscription = this.storeService.getStores(this.currentPage, this.pageSize, criteria)
			.pipe(take(1))
			.subscribe({
				next: (data: { stores: Store[]; total: number }) => {
					this.items = data.stores;
					this.totalItems = data.total;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
				},
				error: (err: any) => {
					console.error('Ошибка загрузки магазинов:', err);
					this.errorMessage = 'Ошибка загрузки магазинов.';
					this.snackBar.open('Ошибка загрузки магазинов', 'Закрыть', { duration: 3000 });
				}
			});
	}

	searchStores(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();
		this.searchSubscription = this.storeService.searchAllStores(criteria)
			.pipe(take(1))
			.subscribe({
				next: (stores: Store[]) => {
					this.allStores = stores;
					this.totalItems = stores.length;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.setDisplayedStores();
				},
				error: (err: any) => {
					console.error('Ошибка поиска магазинов:', err);
					this.errorMessage = 'Ошибка поиска магазинов.';
					this.snackBar.open('Ошибка поиска магазинов', 'Закрыть', { duration: 3000 });
				}
			});
	}

	selectStore(store: Store): void {
		this.itemSelected.emit(store);
		this.closeModal();
	}

	addItem(): void {
		if (this.addForm.invalid) {
			this.errorMessage = 'Название не может быть пустым';
			this.snackBar.open('Название не может быть пустым', 'Закрыть', { duration: 3000 });
			return;
		}

		const newItemName = this.addForm.get('newItemName')!.value.trim();
		if (!newItemName) {
			this.errorMessage = 'Название не может быть пустым';
			this.snackBar.open('Название не может быть пустым', 'Закрыть', { duration: 3000 });
			return;
		}

		this.addSubscription = this.storeService.createStore(newItemName)
			.pipe(take(1))
			.subscribe({
				next: (response: Store) => {
					this.itemSelected.emit(response);
					this.closeModal();
				},
				error: (err: any) => {
					console.error('Ошибка добавления магазина:', err);
					this.errorMessage = 'Ошибка добавления магазина.';
					this.snackBar.open('Ошибка добавления магазина', 'Закрыть', { duration: 3000 });
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