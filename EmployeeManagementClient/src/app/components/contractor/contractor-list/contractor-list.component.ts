import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
	selector: 'app-contractor-list',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule, RouterModule, NgxMaskDirective, FormsModule],
	providers: [provideNgxMask()],
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit {
	contractors: Contractor[] = []; // Все записи (при поиске)
	displayedContractors: Contractor[] = []; // Записи для текущей страницы
	searchForm: FormGroup;
	isExpanded = false;
	isLoading = false;
	isSearchMode = false;

	// Пагинация
	currentPage = 1;
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];
	searchParams: any = {};

	constructor(
		private contractorService: ContractorWatchService,
		private fb: FormBuilder,
		private router: Router
	) {
		this.searchForm = this.fb.group({
			Id: [''],
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
		this.loadContractors(); // Загружаем данные при инициализации
	}

	loadContractors(): void {
		// Формируем параметры для запроса, включая пагинацию
		const params = {
			page: this.currentPage,
			pageSize: this.pageSize,
			...this.searchParams // Если есть параметры поиска
		};

		console.log('Параметры запроса:', params); // Лог параметров запроса

		this.isLoading = true;

		this.contractorService.getContractors(params).subscribe({
			next: (response: any) => {
				this.isLoading = false;
				console.log('Ответ сервера:', response); // Лог полного ответа сервера

				if (response && response.contractors) {
					console.log('Полученные контрагенты до обработки:', response.contractors); // Лог необработанных данных

					// Обработка данных от сервера
					if (Array.isArray(response.contractors)) {
						console.log('Массив contractors корректный'); // Проверка структуры
						this.contractors = response.contractors.map((contractor: Contractor) =>
							this.normalizePhotos(contractor)
						);
					} else {
						console.error('Некорректный формат поля contractors:', response.contractors);
						this.contractors = [];
					}

					this.totalItems = response.total > 0 ? response.total : this.contractors.length;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);

					console.log('Обработанные контрагенты:', this.contractors); // Лог после обработки

					this.totalItems = response.total || 0; // Сервер должен возвращать общее количество записей
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);

					console.log('Всего записей:', this.totalItems, 'Всего страниц:', this.totalPages); // Лог пагинации

					this.displayedContractors = this.contractors; // Отображаем полученные записи
					console.log('Отображаемые контрагенты:', this.displayedContractors); // Лог отображаемых данных

					this.updateVisiblePages();
				} else {
					console.error('Некорректный ответ сервера:', response);
					this.resetPagination();
				}
			},
			error: (error: any) => {
				this.isLoading = false;
				console.error('Ошибка при загрузке контрагентов:', error);
				this.resetPagination();
			}
		});
	}

	searchContractors(): void {
		this.isSearchMode = true;
		this.isLoading = true;
		this.currentPage = 1;

		const searchParams = this.prepareSearchParams();
		console.log('Параметры для поиска:', searchParams);

		this.contractorService.searchContractors(searchParams).subscribe({
			next: (response: any) => {
				this.isLoading = false;
				console.log('Ответ сервера:', response);

				if (response && response.contractors) {
					console.log('Сырые данные контрагентов:', response.contractors);

					// Обработка данных
					this.contractors = response.contractors.map((contractor: Contractor) => {
						const normalized = this.normalizePhotos(contractor);
						console.log(`Контрагент после нормализации (ID: ${normalized.id}):`, normalized);
						return normalized;
					});

					this.totalItems = response.total > 0 ? response.total : this.contractors.length;
					this.totalPages = Math.ceil(this.totalItems / this.pageSize);

					console.log('Обработанные данные контрагентов:', this.contractors);

					// Обновление отображаемых данных
					this.displayedContractors = this.contractors.slice(0, this.pageSize);
					console.log('Отображаемые контрагенты:', this.displayedContractors);
				} else {
					console.error('Некорректный или пустой ответ сервера:', response);
				}
			},
			error: (error: any) => {
				console.error('Ошибка при выполнении поиска контрагентов:', error);
				this.isLoading = false;
			}
		});
	}

	extractContractors(response: any): Contractor[] {
		if (response && response.contractors && Array.isArray(response.contractors)) {
			return response.contractors;
		} else if (response && response.Contractors && Array.isArray(response.Contractors)) {
			return response.Contractors;
		} else if (response && response.contractors) {
			return response.contractors;
		} else if (response && response.$values) {
			return response.$values;
		} else if (Array.isArray(response)) {
			return response;
		} else {
			console.error('Неизвестный формат ответа сервера:', response);
			return [];
		}
	}

	// Сброс фильтров
	resetFilters(): void {
		this.searchForm.reset();
		this.searchParams = {};
		this.isSearchMode = false;
		this.currentPage = 1;
		this.loadContractors();
	}

	// Обновление данных для текущей страницы (только для поиска)
	updatePagination(): void {
		this.displayedContractors = this.contractors.slice(
			(this.currentPage - 1) * this.pageSize,
			this.currentPage * this.pageSize
		);
		this.updateVisiblePages();
	}

	resetPagination(): void {
		this.contractors = [];
		this.displayedContractors = [];
		this.totalItems = 0;
		this.totalPages = 0;
		this.visiblePages = [];
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const totalVisiblePages = 7; // Максимальное количество видимых страниц

		if (this.totalPages <= totalVisiblePages) {
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

	goToPage(page: number | string): void {
		if (typeof page !== 'number') {
			return; // Если page не число, ничего не делаем
		}
		if (page < 1 || page > this.totalPages) return;
		this.currentPage = page;

		if (this.isSearchMode) {
			this.updatePagination();
		} else {
			this.loadContractors();
		}
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.totalPages = Math.ceil(this.totalItems / this.pageSize);

		if (this.isSearchMode) {
			this.updatePagination();
		} else {
			this.loadContractors();
		}
	}

	onPageClick(page: number | string): void {
		if (page !== '...') {
			this.goToPage(page as number);
		}
	}

	prepareSearchParams(): any {
		const params = { ...this.searchForm.value };
		Object.keys(params).forEach((key) => {
			if (!params[key]) {
				delete params[key];
			}
		});
		return params;
	}

	normalizePhotos(contractor: Contractor): Contractor {
		// Убрана проверка на `$values`
		contractor.photos = Array.isArray(contractor.photos) ? contractor.photos : [];
		return contractor;
	}

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

	toggleSearchForm(): void {
		this.isExpanded = !this.isExpanded;
	}

	navigateToDetails(id: number): void {
		this.router.navigate(['/contractors/details', id]);
	}

	navigateToEdit(id: number): void {
		this.router.navigate(['/contractors/edit', id]);
	}
}
