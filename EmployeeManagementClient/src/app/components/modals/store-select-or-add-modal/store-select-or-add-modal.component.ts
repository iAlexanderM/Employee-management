import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { StorePointsService } from '../../../services/store-points.service';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
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
		MatSelectModule,
		MatIconModule,
		MatSnackBarModule
	],
	templateUrl: './store-select-or-add-modal.component.html',
	styleUrls: ['./store-select-or-add-modal.component.css']
})
export class StoreSelectOrAddModalComponent implements OnInit, OnDestroy {
	@Input() fieldName: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	@Input() mode: 'select' | 'add' = 'select';
	@Output() modalClose = new EventEmitter<void>();
	@Output() itemSelected = new EventEmitter<any>();
	@Output() itemAdded = new EventEmitter<any>();

	currentPage = 1;
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	items: any[] = [];
	filteredItems: any[] = [];
	searchForm: FormGroup;
	addForm: FormGroup;
	errorMessage = '';
	isExpanded = true;
	visiblePages: (number | string)[] = [];
	isSearchMode = false;
	pageSizeOptions = [25, 50, 100];
	pageSizeControl: FormControl;

	private loadSubscription: Subscription | null = null;
	private searchSubscription: Subscription | null = null;
	private addSubscription: Subscription | null = null;
	private pageSizeSubscription: Subscription | null = null;

	constructor(
		private storePointsService: StorePointsService,
		private fb: FormBuilder,
		private renderer: Renderer2,
		private el: ElementRef,
		private snackBar: MatSnackBar
	) {
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});

		this.addForm = this.fb.group({
			newItemName: ['', Validators.required]
		});

		this.pageSizeControl = this.fb.control(this.pageSize);
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
		this.isSearchMode = false;
		this.pageSizeSubscription = this.pageSizeControl.valueChanges.subscribe(value => {
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

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	loadItems(): void {
		const loadMethod = this.getLoadMethod();
		const fieldKey = this.getFieldKey();
		this.loadSubscription = loadMethod(this.currentPage, this.pageSize, {}, false)
			.pipe(take(1))
			.subscribe({
				next: (data: any) => {
					this.items = data[fieldKey] || [];
					this.filteredItems = this.items;
					this.totalItems = data.total || this.items.length;
					this.calculateTotalPages();
					this.updateVisiblePages();
				},
				error: (error: any) => {
					this.errorMessage = 'Ошибка загрузки данных';
					this.snackBar.open('Ошибка загрузки данных', 'Закрыть', { duration: 3000 });
					console.error(error);
				}
			});
	}

	getLoadMethod(): (page: number, pageSize: number, filters: { [key: string]: any }, isArchived: boolean) => Observable<any> {
		switch (this.fieldName) {
			case 'building': return this.storePointsService.getBuildings.bind(this.storePointsService);
			case 'floor': return this.storePointsService.getFloors.bind(this.storePointsService);
			case 'line': return this.storePointsService.getLines.bind(this.storePointsService);
			case 'storeNumber': return this.storePointsService.getStoreNumbers.bind(this.storePointsService);
			default: throw new Error('Неизвестный тип записи');
		}
	}

	getSearchMethod(): (criteria: { [key: string]: any }, isArchived: boolean) => Observable<any> {
		switch (this.fieldName) {
			case 'building': return this.storePointsService.searchBuildings.bind(this.storePointsService);
			case 'floor': return this.storePointsService.searchFloors.bind(this.storePointsService);
			case 'line': return this.storePointsService.searchLines.bind(this.storePointsService);
			case 'storeNumber': return this.storePointsService.searchStoreNumbers.bind(this.storePointsService);
			default: throw new Error('Неизвестный тип записи');
		}
	}

	getAddMethod(): (name: string) => Observable<any> {
		switch (this.fieldName) {
			case 'building': return this.storePointsService.addBuilding.bind(this.storePointsService);
			case 'floor': return this.storePointsService.addFloor.bind(this.storePointsService);
			case 'line': return this.storePointsService.addLine.bind(this.storePointsService);
			case 'storeNumber': return this.storePointsService.addStoreNumber.bind(this.storePointsService);
			default: throw new Error('Неизвестный тип записи');
		}
	}

	getFieldKey(): string {
		switch (this.fieldName) {
			case 'building': return 'buildings';
			case 'floor': return 'floors';
			case 'line': return 'lines';
			case 'storeNumber': return 'storeNumbers';
			default: throw new Error('Неизвестный тип записи');
		}
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		if (this.totalPages <= 7) {
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

	goToPage(page: number): void {
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
			if (this.isSearchMode) {
				this.updateDisplayedItems();
			} else {
				this.loadItems();
			}
			this.updateVisiblePages();
		}
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = {};
		const { Id, Name } = this.searchForm.value;
		if (Id) criteria['Id'] = Id;
		if (Name) criteria['Name'] = Name.trim();
		return criteria;
	}

	searchItems(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const searchMethod = this.getSearchMethod();
		const criteria = this.prepareSearchCriteria();
		const fieldKey = this.getFieldKey();

		this.searchSubscription = searchMethod(criteria, false)
			.pipe(take(1))
			.subscribe({
				next: (data: any) => {
					this.items = data[fieldKey] || [];
					this.totalItems = data.total || this.items.length;
					this.calculateTotalPages();
					this.updateVisiblePages();
					this.updateDisplayedItems();
				},
				error: (error: any) => {
					this.errorMessage = 'Ошибка выполнения поиска';
					this.snackBar.open('Ошибка выполнения поиска', 'Закрыть', { duration: 3000 });
					console.error(error);
				}
			});
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.loadItems();
	}

	selectItem(item: any): void {
		this.itemSelected.emit(item);
		this.closeModal();
	}

	addItem(): void {
		if (this.addForm.invalid) {
			this.errorMessage = 'Название не может быть пустым';
			this.snackBar.open('Название не может быть пустым', 'Закрыть', { duration: 3000 });
			return;
		}

		const newItemName = this.addForm.get('newItemName')!.value.trim();
		const addMethod = this.getAddMethod();
		this.addSubscription = addMethod(newItemName)
			.pipe(take(1))
			.subscribe({
				next: (response: any) => {
					this.itemAdded.emit(response.name);
					this.closeModal();
				},
				error: (error: any) => {
					this.errorMessage = error.message || 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
					this.snackBar.open(this.errorMessage, 'Закрыть', { duration: 3000 });
					console.error(error);
				}
			});
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) {
			this.updateDisplayedItems();
		} else {
			this.loadItems();
		}
	}

	updateDisplayedItems(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.filteredItems = this.items.slice(startIndex, endIndex);
	}
}