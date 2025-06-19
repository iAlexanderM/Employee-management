import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { StorePointsService } from '../../../services/store-points.service';
import { Observable, Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

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
		MatIconModule],
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
	pageSizeControl!: FormControl;

	private subscriptions: Subscription[] = [];

	constructor(
		private storePointsService: StorePointsService,
		private fb: FormBuilder
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

	ngOnInit() {
		this.isSearchMode = false;

		this.subscriptions.push(
			this.pageSizeControl.valueChanges.subscribe(value => {
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

	onPageClick(page: number | string) {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	loadItems() {
		const loadMethod = this.getLoadMethod();
		const fieldKey = this.getFieldKey();
		// Pass isArchived=false to fetch only non-archived items
		loadMethod(this.currentPage, this.pageSize, {}, false).subscribe({
			next: (data: any) => {
				this.items = data[fieldKey] || [];
				this.filteredItems = this.items;
				this.totalItems = data.total || this.items.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
			},
			error: (error: any) => {
				this.errorMessage = 'Ошибка загрузки данных';
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

	calculateTotalPages() {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	updateVisiblePages() {
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

	goToPage(page: number) {
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

		// Pass isArchived=false for search
		searchMethod(criteria, false).subscribe({
			next: (data: any) => {
				this.items = data[fieldKey] || [];
				this.totalItems = data.total || this.items.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedItems();
			},
			error: (error: any) => {
				this.errorMessage = 'Ошибка выполнения поиска';
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

	selectItem(item: any) {
		this.itemSelected.emit(item);
		this.closeModal();
	}

	addItem(): void {
		if (this.addForm.invalid) {
			this.errorMessage = 'Название не может быть пустым';
			return;
		}

		const newItemName = this.addForm.get('newItemName')?.value.trim();
		const addMethod = this.getAddMethod();
		addMethod(newItemName).subscribe({
			next: (response: any) => {
				this.itemAdded.emit(response.name);
				this.closeModal();
			},
			error: (error: any) => {
				this.errorMessage = error.message || 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
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