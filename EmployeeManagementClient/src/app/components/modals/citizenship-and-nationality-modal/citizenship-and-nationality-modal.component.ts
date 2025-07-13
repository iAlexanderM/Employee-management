import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Citizenship, Nationality } from '../../../models/contractor-points.model';
import { ContractorPointsService } from '../../../services/contractor-points.service';
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
	selector: 'app-citizenship-and-nationality-modal',
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
	templateUrl: './citizenship-and-nationality-modal.component.html',
	styleUrls: ['./citizenship-and-nationality-modal.component.css']
})
export class CitizenshipAndNationalityModalComponent implements OnInit, OnDestroy {
	// Входные параметры для конфигурации модального окна
	@Input() fieldName: string = '';
	@Input() title: string = 'Модальное окно';
	@Input() mode: 'select' | 'add' = 'select';
	@Input() type: 'citizenship' | 'nationality' = 'citizenship';
	@Output() modalClose = new EventEmitter<void>();
	@Output() itemSelected = new EventEmitter<Citizenship | Nationality>();
	@Output() itemAdded = new EventEmitter<Citizenship | Nationality>();

	// Формы для поиска, пагинации и добавления
	searchForm: FormGroup;
	paginationForm: FormGroup;
	addForm: FormGroup;
	errorMessage: string = '';

	// Параметры пагинации и данных
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

	// Подписка для отслеживания изменений pageSize
	private pageSizeSubscription: Subscription | null = null;

	constructor(
		private fb: FormBuilder,
		private contractorPointsService: ContractorPointsService,
		private renderer: Renderer2,
		private el: ElementRef,
		private snackBar: MatSnackBar
	) {
		// Инициализация формы поиска
		this.searchForm = this.fb.group({
			Id: [''],
			Name: ['']
		});

		// Инициализация формы добавления
		this.addForm = this.fb.group({
			newItemName: ['', Validators.required]
		});

		// Инициализация формы пагинации
		this.paginationForm = this.fb.group({
			pageSize: [this.pageSize, [Validators.required, Validators.min(1)]]
		});
	}

	ngOnInit(): void {
		// Перемещаем модальное окно в <body> для корректного отображения
		this.renderer.appendChild(document.body, this.el.nativeElement);

		// Инициализация состояния поиска
		this.isSearchMode = false;
		if (this.mode === 'select') {
			this.loadItems();
		}

		// Подписка на изменение размера страницы (без ?. так как pageSize гарантированно существует)
		this.pageSizeSubscription = this.paginationForm.get('pageSize')!.valueChanges.subscribe(value => {
			this.pageSize = Number(value);
			this.onPageSizeChange();
		});
	}

	ngOnDestroy(): void {
		// Очистка подписки
		if (this.pageSizeSubscription) {
			this.pageSizeSubscription.unsubscribe();
		}
		// Удаление модального окна из <body>
		this.renderer.removeChild(document.body, this.el.nativeElement);
	}

	// Закрытие модального окна
	closeModal(): void {
		this.modalClose.emit();
	}

	// Предотвращение закрытия при клике внутри модального окна
	stopPropagation(event: Event): void {
		event.stopPropagation();
	}

	// Загрузка данных (гражданства или национальности)
	loadItems(): void {
		const loadMethod = this.getLoadMethod();
		const fieldKey = this.getFieldKey();
		loadMethod(this.currentPage, this.pageSize)
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
					this.errorMessage = 'Ошибка при загрузке данных.';
					console.error('Ошибка загрузки:', error);
					this.snackBar.open('Ошибка при загрузке данных.', 'Закрыть', { duration: 3000 });
				}
			});
	}

	// Получение метода загрузки данных
	private getLoadMethod(): (page: number, pageSize: number) => Observable<any> {
		switch (this.type) {
			case 'citizenship':
				return this.contractorPointsService.getCitizenships.bind(this.contractorPointsService);
			case 'nationality':
				return this.contractorPointsService.getNationalities.bind(this.contractorPointsService);
			default:
				throw new Error('Неизвестный тип');
		}
	}

	// Получение метода поиска
	private getSearchMethod(): (criteria: { [key: string]: any }) => Observable<any> {
		switch (this.type) {
			case 'citizenship':
				return this.contractorPointsService.searchCitizenships.bind(this.contractorPointsService);
			case 'nationality':
				return this.contractorPointsService.searchNationalities.bind(this.contractorPointsService);
			default:
				throw new Error('Неизвестный тип');
		}
	}

	// Получение метода добавления
	private getAddMethod(): (name: string) => Observable<any> {
		switch (this.type) {
			case 'citizenship':
				return this.contractorPointsService.addCitizenship.bind(this.contractorPointsService);
			case 'nationality':
				return this.contractorPointsService.addNationality.bind(this.contractorPointsService);
			default:
				throw new Error('Неизвестный тип');
		}
	}

	// Получение ключа для данных
	private getFieldKey(): string {
		switch (this.type) {
			case 'citizenship':
				return 'citizenships';
			case 'nationality':
				return 'nationalities';
			default:
				throw new Error('Неизвестный тип');
		}
	}

	// Вычисление общего количества страниц
	private calculateTotalPages(): void {
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);
	}

	// Обновление отображаемых страниц для пагинации
	private updateVisiblePages(): void {
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

	// Переход на страницу
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

	// Обработка клика по странице
	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	// Подготовка критериев поиска
	private prepareSearchCriteria(): { [key: string]: any } {
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

	// Поиск элементов
	searchItems(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		const searchMethod = this.getSearchMethod();
		const criteria = this.prepareSearchCriteria();
		const fieldKey = this.getFieldKey();
		searchMethod(criteria)
			.pipe(take(1))
			.subscribe({
				next: (data: any) => {
					this.items = data[fieldKey] || [];
					this.totalItems = this.items.length;
					this.calculateTotalPages();
					this.updateVisiblePages();
					this.updateDisplayedItems();
				},
				error: (error: any) => {
					this.errorMessage = 'Ошибка при выполнении поиска.';
					console.error('Ошибка поиска:', error);
					this.snackBar.open('Ошибка при выполнении поиска.', 'Закрыть', { duration: 3000 });
				}
			});
	}

	// Сброс фильтров поиска
	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.loadItems();
	}

	// Обновление отображаемых элементов
	private updateDisplayedItems(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.filteredItems = this.items.slice(startIndex, endIndex);
	}

	// Обработка изменения размера страницы
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

	// Выбор элемента
	selectItem(item: Citizenship | Nationality): void {
		if (!item.id) {
			this.errorMessage = 'Ошибка: у элемента отсутствует ID.';
			this.snackBar.open('Ошибка: у элемента отсутствует ID.', 'Закрыть', { duration: 3000 });
			return;
		}
		this.itemSelected.emit(item);
		this.closeModal();
	}

	// Добавление нового элемента
	addItem(): void {
		if (this.addForm.invalid) {
			this.errorMessage = 'Пожалуйста, введите название.';
			this.snackBar.open('Пожалуйста, введите название.', 'Закрыть', { duration: 3000 });
			return;
		}

		const trimmedName = this.addForm.get('newItemName')?.value.trim();
		if (!trimmedName) {
			this.errorMessage = 'Название не может быть пустым.';
			this.snackBar.open('Название не может быть пустым.', 'Закрыть', { duration: 3000 });
			return;
		}

		const addMethod = this.getAddMethod();
		addMethod(trimmedName)
			.pipe(take(1))
			.subscribe({
				next: (data: any) => {
					this.itemAdded.emit(data);
					this.closeModal();
				},
				error: (error: any) => {
					if (error.status === 409) {
						this.errorMessage = 'Запись с таким именем уже существует. Пожалуйста, выберите другое имя.';
						this.snackBar.open('Запись с таким именем уже существует.', 'Закрыть', { duration: 3000 });
					} else {
						this.errorMessage = 'Ошибка при добавлении. Попробуйте снова.';
						this.snackBar.open('Ошибка при добавлении. Попробуйте снова.', 'Закрыть', { duration: 3000 });
					}
					console.error('Ошибка добавления:', error);
				}
			});
	}
}