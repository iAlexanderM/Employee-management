import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Citizenship, Nationality } from '../../../models/contractor-points.model';
import { ContractorPointsService } from '../../../services/contractor-points.service';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-citizenship-and-nationality-modal',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './citizenship-and-nationality-modal.component.html',
	styleUrls: ['./citizenship-and-nationality-modal.component.css']
})
export class CitizenshipAndNationalityModalComponent implements OnInit {
	@Input() fieldName: string = '';
	@Input() title: string = 'Модальное окно';
	@Input() mode: 'select' | 'add' = 'select';
	@Input() type: 'citizenship' | 'nationality' = 'citizenship';
	@Output() modalClose = new EventEmitter<void>();
	@Output() itemSelected = new EventEmitter<Citizenship | Nationality>();
	@Output() itemAdded = new EventEmitter<Citizenship | Nationality>();

	searchForm: FormGroup;
	paginationForm: FormGroup;
	addForm: FormGroup;
	errorMessage: string = '';

	currentPage = 1;
	pageSize = 25;
	pageSizeOptions: number[] = [25, 50, 100];
	totalItems: number = 0;
	totalPages: number = 0;
	items: (Citizenship | Nationality)[] = [];
	filteredItems: (Citizenship | Nationality)[] = [];
	isExpanded: boolean = true;
	visiblePages: Array<number | string> = [];
	isSearchMode: boolean = false;

	constructor(private fb: FormBuilder, private contractorPointsService: ContractorPointsService) {
		// Инициализация формы поиска с валидаторами
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});

		// Инициализация формы добавления с валидаторами
		this.addForm = this.fb.group({
			newItemName: ['', Validators.required]
		});

		// Инициализация формы пагинации с валидаторами
		this.paginationForm = this.fb.group({
			pageSize: [this.pageSize, [Validators.required, Validators.min(1)]]
		});
	}

	ngOnInit(): void {
		this.isSearchMode = false;
		if (this.mode === 'select') {
			this.loadItems();
		}

		// Подписка на изменения pageSize
		this.paginationForm.get('pageSize')?.valueChanges.subscribe(value => {
			this.pageSize = Number(value);
			this.onPageSizeChange();
		});
	}

	closeModal(): void {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}

	loadItems(): void {
		const loadMethod = this.getLoadMethod();
		const fieldKey = this.getFieldKey();
		loadMethod(this.currentPage, this.pageSize).subscribe(
			(data: any) => {
				this.items = data[fieldKey] || [];
				this.filteredItems = this.items; // При серверной пагинации
				this.totalItems = data.total || this.items.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
			},
			(error: any) => {
				this.errorMessage = 'Ошибка при загрузке данных.';
				console.error(error);
			}
		);
	}

	getLoadMethod(): (page: number, pageSize: number) => Observable<any> {
		switch (this.type) {
			case 'citizenship':
				return this.contractorPointsService.getCitizenships.bind(this.contractorPointsService);
			case 'nationality':
				return this.contractorPointsService.getNationalities.bind(this.contractorPointsService);
			default:
				throw new Error('Неизвестный тип');
		}
	}

	getSearchMethod(): (criteria: { [key: string]: any }) => Observable<any> {
		switch (this.type) {
			case 'citizenship':
				return this.contractorPointsService.searchCitizenships.bind(this.contractorPointsService);
			case 'nationality':
				return this.contractorPointsService.searchNationalities.bind(this.contractorPointsService);
			default:
				throw new Error('Неизвестный тип');
		}
	}

	getAddMethod(): (name: string) => Observable<any> {
		switch (this.type) {
			case 'citizenship':
				return this.contractorPointsService.addCitizenship.bind(this.contractorPointsService);
			case 'nationality':
				return this.contractorPointsService.addNationality.bind(this.contractorPointsService);
			default:
				throw new Error('Неизвестный тип');
		}
	}

	getFieldKey(): string {
		switch (this.type) {
			case 'citizenship':
				return 'citizenships';
			case 'nationality':
				return 'nationalities';
			default:
				throw new Error('Неизвестный тип');
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

	onPageClick(page: number | string) {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = {};
		const { Id, Name } = this.searchForm.value;
		if (Id) {
			criteria['Id'] = Id;
		}
		if (Name) {
			criteria['Name'] = Name.trim();
		}
		return criteria;
	}

	searchItems(): void {
		this.isSearchMode = true;
		this.currentPage = 1; // Сброс на первую страницу при новом поиске
		const searchMethod = this.getSearchMethod();
		const criteria = this.prepareSearchCriteria();
		const fieldKey = this.getFieldKey();
		searchMethod(criteria).subscribe(
			(data: any) => {
				this.items = data[fieldKey] || [];
				this.totalItems = this.items.length;
				this.calculateTotalPages();
				this.updateVisiblePages();
				this.updateDisplayedItems();
			},
			(error: any) => {
				this.errorMessage = 'Ошибка при выполнении поиска.';
				console.error(error);
			}
		);
	}

	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.loadItems();
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
		if (this.isSearchMode) {
			this.updateDisplayedItems();
		} else {
			this.loadItems();
		}
	}

	selectItem(item: Citizenship | Nationality): void {
		if (!item.id) {
			this.errorMessage = 'Ошибка: у элемента отсутствует ID.';
			return;
		}
		this.itemSelected.emit(item);
		this.closeModal();
	}

	addItem(): void {
		if (this.addForm.invalid) {
			this.errorMessage = 'Пожалуйста, введите название.';
			return;
		}

		const trimmedName = this.addForm.get('newItemName')?.value.trim();
		if (!trimmedName) {
			this.errorMessage = 'Название не может быть пустым.';
			return;
		}

		const addMethod = this.getAddMethod();
		addMethod(trimmedName).subscribe(
			(data: any) => {
				this.itemAdded.emit(data);
				this.closeModal();
			},
			(error: any) => {
				if (error.status === 409) {
					this.errorMessage = 'Запись с таким именем уже существует. Пожалуйста, выберите другое имя.';
				} else {
					this.errorMessage = 'Ошибка при добавлении. Попробуйте снова.';
				}
			}
		);
	}
}