import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, Renderer2, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Position } from '../../../models/position.model';
import { PositionService } from '../../../services/position.service';
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

@Component({
	selector: 'app-position-modal',
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
		MatSnackBarModule
	],
	templateUrl: './position-modal.component.html',
	styleUrls: ['./position-modal.component.css']
})
export class PositionModalComponent implements OnInit, OnChanges, OnDestroy {
	@Input() isVisible: boolean = false;
	@Input() mode: 'select' | 'add' = 'select';
	@Output() modalClose = new EventEmitter<void>();
	@Output() itemSelected = new EventEmitter<string>();
	@Output() itemAdded = new EventEmitter<Position>();

	searchForm: FormGroup;
	paginationForm: FormGroup;
	addForm: FormGroup;
	errorMessage: string = '';
	currentPage = 1;
	pageSize = 25;
	pageSizeOptions: number[] = [25, 50, 100];
	totalItems: number = 0;
	totalPages: number = 0;
	items: Position[] = [];
	filteredItems: Position[] = [];
	isSearchMode: boolean = false;
	visiblePages: Array<number | string> = [];

	private loadSubscription: Subscription | null = null;
	private searchSubscription: Subscription | null = null;
	private addSubscription: Subscription | null = null;
	private pageSizeSubscription: Subscription | null = null;

	constructor(
		private fb: FormBuilder,
		private positionService: PositionService,
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

		this.paginationForm = this.fb.group({
			pageSize: [this.pageSize, [Validators.required, Validators.min(1)]]
		});
	}

	ngOnInit(): void {
		this.renderer.appendChild(document.body, this.el.nativeElement);
		this.isSearchMode = false;
		this.pageSizeSubscription = this.paginationForm.get('pageSize')!.valueChanges.subscribe(value => {
			this.pageSize = Number(value);
			this.onPageSizeChange();
		});
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['isVisible'] && this.isVisible && this.mode === 'select') {
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

	loadItems(): void {
		this.loadSubscription = this.positionService.getPositions(this.currentPage, this.pageSize)
			.pipe(take(1))
			.subscribe({
				next: (data: any) => {
					this.items = data.positions || [];
					this.filteredItems = this.items;
					this.totalItems = data.total || this.items.length;
					this.calculateTotalPages();
					this.updateVisiblePages();
				},
				error: (error: any) => {
					this.errorMessage = 'Ошибка при загрузке данных: ' + error.message;
					this.snackBar.open('Ошибка при загрузке данных', 'Закрыть', { duration: 3000 });
					console.error(error);
				}
			});
	}

	searchItems(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const criteria = this.prepareSearchCriteria();
		this.searchSubscription = this.positionService.searchPositions(criteria)
			.pipe(take(1))
			.subscribe({
				next: (data: any) => {
					this.items = data.positions || [];
					this.totalItems = this.items.length;
					this.calculateTotalPages();
					this.updateVisiblePages();
					this.updateDisplayedItems();
				},
				error: (error: any) => {
					this.errorMessage = 'Ошибка при выполнении поиска: ' + error.message;
					this.snackBar.open('Ошибка при поиске', 'Закрыть', { duration: 3000 });
					console.error(error);
				}
			});
	}

	addItem(): void {
		if (this.addForm.invalid) {
			this.errorMessage = 'Пожалуйста, введите название.';
			this.snackBar.open('Пожалуйста, введите название', 'Закрыть', { duration: 3000 });
			return;
		}

		const trimmedName = this.addForm.get('newItemName')!.value.trim();
		if (!trimmedName) {
			this.errorMessage = 'Название не может быть пустым.';
			this.snackBar.open('Название не может быть пустым', 'Закрыть', { duration: 3000 });
			return;
		}

		this.addSubscription = this.positionService.addPosition(trimmedName)
			.pipe(take(1))
			.subscribe({
				next: (data: any) => {
					this.itemAdded.emit(data);
					this.addForm.reset();
					if (this.mode === 'select') this.loadItems();
					this.closeModal();
				},
				error: (error: any) => {
					this.errorMessage = error.status === 409
						? 'Запись с таким именем уже существует.'
						: 'Ошибка при добавлении: ' + error.message;
					this.snackBar.open(this.errorMessage, 'Закрыть', { duration: 3000 });
					console.error(error);
				}
			});
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = {};
		const { Id, Name } = this.searchForm.value;
		if (Id) criteria['Id'] = Id;
		if (Name) criteria['Name'] = Name.trim();
		return criteria;
	}

	selectItem(item: Position): void {
		if (!item.name) {
			this.errorMessage = 'Ошибка: у элемента отсутствует название.';
			this.snackBar.open('Ошибка: у элемента отсутствует название', 'Закрыть', { duration: 3000 });
			return;
		}
		this.itemSelected.emit(item.name);
		this.closeModal();
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.loadItems();
	}

	calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		if (this.totalPages <= 7) {
			for (let i = 1; i <= this.totalPages; i++) pages.push(i);
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 6; i++) pages.push(i);
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) pages.push(i);
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
			if (this.isSearchMode) this.updateDisplayedItems();
			else this.loadItems();
			this.updateVisiblePages();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') this.goToPage(page as number);
	}

	updateDisplayedItems(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.filteredItems = this.items.slice(startIndex, endIndex);
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.calculateTotalPages();
		this.updateVisiblePages();
		if (this.isSearchMode) this.updateDisplayedItems();
		else this.loadItems();
	}
}