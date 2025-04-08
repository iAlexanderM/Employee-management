import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import {
	ReactiveFormsModule,
	FormBuilder,
	FormGroup,
	FormControl
} from '@angular/forms';

@Component({
	selector: 'app-pass-type-list',
	standalone: true,
	imports: [CommonModule, RouterModule, ReactiveFormsModule],
	templateUrl: './pass-type-list.component.html',
	styleUrls: ['./pass-type-list.component.css'],
})
export class PassTypeListComponent implements OnInit {
	passTypes: PassType[] = [];
	displayedPassTypes: PassType[] = [];

	groupId!: number;
	groupName!: string;

	// Форма для поиска (reactive)
	searchForm: FormGroup;

	// Параметры пагинации
	currentPage = 1;
	pageSizeOptions = [25, 50, 100];

	// Изначально задаём 25
	pageSize = 25;

	// FormControl для pageSize (с nonNullable=true, чтобы не было null)
	pageSizeControl: FormControl<number>;

	// Массив страниц для отображения
	visiblePages: (number | string)[] = [];

	constructor(
		private passGroupTypeService: PassGroupTypeService,
		private route: ActivatedRoute,
		private fb: FormBuilder
	) {
		// Создаём FormGroup для поиска
		this.searchForm = this.fb.group({
			// Можно задать строгие типы, но для краткости оставим [null], ['']
			id: [null],
			name: ['']
		});

		// Создаём FormControl для pageSize с nonNullable
		this.pageSizeControl = this.fb.control<number>(this.pageSize, { nonNullable: true });
	}

	ngOnInit(): void {
		// Подписка на изменения размера страницы
		this.pageSizeControl.valueChanges.subscribe((newValue) => {
			// newValue уже number, thanks to nonNullable
			this.pageSize = newValue;
			this.onPageSizeChange();
		});

		// Читаем queryParams (groupId, groupName)
		this.route.queryParams.subscribe((params) => {
			this.groupId = +params['groupId'];
			this.groupName = params['groupName'];
			this.loadPassTypes();
		});
	}

	// Загрузка типов для конкретной группы
	loadPassTypes(): void {
		this.passGroupTypeService.getTypes(this.groupId).subscribe({
			next: (data) => {
				this.passTypes = data;
				this.updatePagination();
			},
			error: (err) => console.error('Ошибка при загрузке типов пропусков:', err),
		});
	}

	// Вызывается при нажатии кнопки "Поиск" (submit формы)
	searchPassTypes(): void {
		// Считываем значения из формы
		const formValue = this.searchForm.value;
		// Если id = null, не передаем id (undefined), а если есть число, передаем его
		const id = formValue.id !== null ? formValue.id : undefined;
		// То же самое с name
		const name = formValue.name ? formValue.name.trim() : undefined;

		this.passGroupTypeService.searchPassTypes(id, name).subscribe({
			next: (data) => {
				this.passTypes = data;
				this.updatePagination();
			},
			error: (err) => console.error('Ошибка при поиске типов пропусков:', err),
		});
	}

	resetFilters(): void {
		// Сброс формы
		this.searchForm.reset({ id: null, name: '' });
		this.currentPage = 1;
		this.loadPassTypes();
	}

	// Пересчитать текущий набор отображаемых данных
	updateDisplayedPassTypes(): void {
		const startIndex = (this.currentPage - 1) * this.pageSize;
		const endIndex = startIndex + this.pageSize;
		this.displayedPassTypes = this.passTypes.slice(startIndex, endIndex);
	}

	onPageSizeChange(): void {
		this.currentPage = 1;
		this.updatePagination();
	}

	// Централизованная логика пересчёта
	updatePagination(): void {
		this.updateDisplayedPassTypes();
		this.calculateVisiblePages();
	}

	calculateVisiblePages(): void {
		const total = this.totalPages();
		const pages: (number | string)[] = [];
		const maxVisiblePages = 7;

		if (total <= maxVisiblePages) {
			for (let i = 1; i <= total; i++) {
				pages.push(i);
			}
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 5; i++) {
					pages.push(i);
				}
				pages.push('...');
				pages.push(total);
			} else if (this.currentPage >= total - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = total - 4; i <= total; i++) {
					pages.push(i);
				}
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(total);
			}
		}

		this.visiblePages = pages;
	}

	onPageClick(page: number | string): void {
		if (typeof page === 'number' && page > 0 && page <= this.totalPages()) {
			this.currentPage = page;
			this.updateDisplayedPassTypes();
			this.calculateVisiblePages();
		}
	}

	totalPages(): number {
		return Math.ceil(this.passTypes.length / this.pageSize);
	}
}
