// contractor-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-contractor-list',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule, RouterModule, NgxMaskDirective],
	providers: [provideNgxMask()],
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit, OnDestroy {
	// Все контрагенты (используется только в режиме поиска)
	allContractors: Contractor[] = [];
	// Отображаемые контрагенты (для таблицы)
	displayedContractors: Contractor[] = [];

	// Общие параметры пагинации
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];

	// Флаги
	isSearchMode = false;
	isExpanded = false; // Добавлено
	isLoading = false;  // Добавлено

	// Активные фильтры
	activeFilters: { [key: string]: any } = {}; // Добавлено

	// Форма поиска
	searchForm: FormGroup;

	private subscriptions: Subscription[] = [];

	constructor(
		private contractorService: ContractorWatchService,
		private router: Router,
		private fb: FormBuilder
	) {
		this.searchForm = this.fb.group({
			Id: ['', Validators.pattern(/^\d+$/)],
			FirstName: [''],
			LastName: [''],
			MiddleName: [''],
			BirthDate: [''],
			DocumentType: [''],
			PassportSerialNumber: [''],
			PassportIssuedBy: [''],
			PassportIssueDate: [''],
			PhoneNumber: ['']
		});
	}

	ngOnInit(): void {
		this.loadContractors(); // Загрузка всех контрагентов при инициализации
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}

	/**
	 * Метод загрузки контрагентов.
	 * @param isSearch - флаг, указывающий, выполняется ли поиск.
	 */
	loadContractors(isSearch: boolean = false): void {
		if (isSearch) {
			this.isSearchMode = true;
			this.currentPage = 1; // Сброс на первую страницу при новом поиске
			this.activeFilters = this.prepareSearchCriteria(); // Подготовка критериев поиска
		} else {
			this.isSearchMode = false;
			this.activeFilters = {}; // Очистка фильтров при отмене поиска
		}

		if (this.isSearchMode) {
			// Клиентская пагинация при поиске: загружаем все соответствующие записи
			this.isLoading = true;
			this.contractorService.searchContractors(this.activeFilters).subscribe({
				next: (response: { contractors: Contractor[]; total: number }) => {
					this.isLoading = false;
					console.log('[loadContractors - Search] Ответ сервера:', response);
					this.allContractors = response.contractors.map(contractor => this.normalizePhotos(contractor));
					this.totalItems = response.total;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);
					this.updateVisiblePages();
					this.setDisplayedContractors(); // Установка отображаемых записей
				},
				error: (err) => {
					this.isLoading = false;
					console.error('[loadContractors - Search] Ошибка:', err);
					this.allContractors = [];
					this.displayedContractors = [];
					this.totalItems = 0;
					this.totalPages = 0;
					this.visiblePages = [];
				},
			});
		} else {
			// Серверная пагинация при отображении всех контрагентов
			const params = {
				page: this.currentPage,
				pageSize: this.pageSize,
				...this.activeFilters // Если есть параметры поиска
			};

			console.log('[loadContractors - Server] Параметры запроса:', params);
			this.isLoading = true;

			this.contractorService.getContractors(params).subscribe({
				next: (response: { total: number, contractors: Contractor[] }) => {
					this.isLoading = false;
					console.log('[loadContractors - Server] Ответ сервера:', response);

					if (response && Array.isArray(response.contractors)) {
						this.displayedContractors = response.contractors.map(contractor => this.normalizePhotos(contractor));
						this.totalItems = response.total || this.displayedContractors.length;
						this.totalPages = Math.ceil(this.totalItems / this.pageSize);
						this.updateVisiblePages();
						console.log('[loadContractors - Server] Отображаемые контрагенты:', this.displayedContractors);
					} else {
						console.error('[loadContractors - Server] Некорректный ответ сервера:', response);
						this.resetPagination();
					}
				},
				error: (err) => {
					this.isLoading = false;
					console.error('[loadContractors - Server] Ошибка:', err);
					this.resetPagination();
				}
			});
		}
	}

	/**
	 * Метод для установки отображаемых контрагентов при клиентской пагинации.
	 */
	private setDisplayedContractors(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedContractors = this.allContractors.slice(startIndex, endIndex);
		console.log('[setDisplayedContractors] Отображаемые контрагенты:', this.displayedContractors);
	}

	/**
	 * Метод для перехода к определенной странице.
	 * @param page - номер страницы.
	 */
	goToPage(page: number | string): void {
		if (typeof page !== 'number') return;

		if (page < 1 || page > this.totalPages) return;

		this.currentPage = page;
		this.updateVisiblePages();

		if (this.isSearchMode) {
			this.setDisplayedContractors(); // Обновление отображаемых контрагентов при поиске
		} else {
			this.loadContractors(); // Загрузка данных с сервера при отображении всех контрагентов
		}
	}

	/**
	 * Обработчик клика по странице пагинации.
	 * @param page - номер страницы или '...'.
	 */
	onPageClick(page: number | string): void {
		if (page === '...') return;
		this.goToPage(page as number);
	}

	/**
	 * Обработчик изменения размера страницы.
	 * @param event - событие изменения.
	 */
	onPageSizeChange(event: Event): void {
		const selectElement = event.target as HTMLSelectElement;
		const newSize = parseInt(selectElement.value, 10);
		if (!isNaN(newSize)) {
			this.pageSize = newSize;
			this.currentPage = 1;
			this.totalPages = this.isSearchMode
				? Math.ceil(this.allContractors.length / this.pageSize)
				: Math.ceil(this.totalItems / this.pageSize);

			console.log(`[onPageSizeChange] Размер страницы изменен на ${this.pageSize}, перезагружаем данные.`);

			if (this.isSearchMode) {
				this.setDisplayedContractors();
			} else {
				this.loadContractors();
			}
		}
	}

	/**
	 * Метод для выполнения поиска контрагентов.
	 */
	searchContractors(): void {
		this.isSearchMode = true;
		this.currentPage = 1;
		this.loadContractors(true);
	}

	/**
	 * Метод для подготовки критериев поиска из формы.
	 */
	prepareSearchCriteria(): { [key: string]: any } {
		const criteria: { [key: string]: any } = {};
		Object.keys(this.searchForm.value).forEach(key => {
			const value = this.searchForm.get(key)?.value;
			if (value !== null && value !== '') {
				criteria[key] = key === 'Id' ? parseInt(value, 10) : value.trim();
			}
		});
		console.log('[prepareSearchCriteria] Сформированные критерии:', criteria);
		return criteria;
	}

	/**
	 * Метод для сброса фильтров поиска.
	 */
	resetFilters(): void {
		this.searchForm.reset();
		this.isSearchMode = false;
		this.currentPage = 1;
		this.activeFilters = {};
		this.loadContractors();
	}

	/**
	 * Обновление видимых страниц пагинации.
	 */
	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const totalVisiblePages = 7; // Максимальное количество отображаемых страниц

		if (this.totalPages <= totalVisiblePages) {
			// Если страниц меньше или равно максимальному количеству
			for (let i = 1; i <= this.totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				// Если текущая страница в начале
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				// Если текущая страница в конце
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
					pages.push(i);
				}
			} else {
				// Если текущая страница в середине
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
		console.log('[updateVisiblePages] Видимые страницы:', this.visiblePages);
	}

	/**
	 * Метод для нормализации фотографий контрагента.
	 * @param contractor - объект контрагента.
	 */
	normalizePhotos(contractor: Contractor): Contractor {
		contractor.photos = Array.isArray(contractor.photos) ? contractor.photos : [];
		return contractor;
	}

	/**
	 * Метод для получения первой фотографии контрагента.
	 * @param contractor - объект контрагента.
	 */
	getFirstPhoto(contractor: Contractor): string | null {
		if (contractor.photos && contractor.photos.length > 0) {
			const photo = contractor.photos[0];
			if (photo && photo.filePath) {
				const filePath = photo.filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
				const fullPath = `http://localhost:8080/${filePath}`;
				return fullPath;
			}
		}
		return null;
	}

	/**
	 * Метод для переключения формы поиска.
	 */
	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	/**
	 * Метод для навигации на страницу деталей контрагента.
	 * @param id - идентификатор контрагента.
	 */
	navigateToDetails(id: number): void {
		this.router.navigate(['/contractors/details', id]);
	}

	/**
	 * Метод для навигации на страницу редактирования контрагента.
	 * @param id - идентификатор контрагента.
	 */
	navigateToEdit(id: number): void {
		this.router.navigate(['/contractors/edit', id]);
	}

	/**
	 * Метод для сброса пагинации в случае ошибки.
	 */
	private resetPagination(): void {
		this.allContractors = [];
		this.displayedContractors = [];
		this.totalItems = 0;
		this.totalPages = 0;
		this.visiblePages = [];
	}
}
