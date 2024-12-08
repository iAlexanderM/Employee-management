import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';

@Component({
	selector: 'app-store-edit',
	standalone: true,
	imports: [CommonModule, FormsModule, StoreSelectOrAddModalComponent],
	templateUrl: './store-edit.component.html',
	styleUrls: ['./store-edit.component.css']
})
export class StoreEditComponent implements OnInit {
	store: Store = { building: '', floor: '', line: '', storeNumber: '', sortOrder: 0, createdAt: new Date() };
	originalStore: Store | null = null; // Оригинальные данные
	storeId: number | null = null;

	isModalOpen = false;
	modalMode: 'select' | 'add' = 'select';
	modalField: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	errorMessage: string | null = null; // Поле для отображения ошибки

	constructor(
		private storeService: StoreService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				this.storeId = Number(params['id']);
				this.loadStore(this.storeId);
			}
		});
	}

	loadStore(id: number): void {
		this.storeService.getStoreById(id).subscribe(store => {
			this.store = { ...store };
			this.originalStore = { ...store }; // Сохраняем оригинальные данные
		});
	}

	isModified(): boolean {
		// Сравниваем оригинальные данные с текущими для проверки изменений
		return JSON.stringify(this.store) !== JSON.stringify(this.originalStore);
	}

	updateStore(): void {
		this.errorMessage = null; // Сброс ошибки

		// Проверяем, были ли внесены изменения
		if (!this.isModified()) {
			this.errorMessage = 'Нет изменений для сохранения.';
			return;
		}

		if (this.storeId) {
			this.storeService.updateStore(this.storeId, this.store).subscribe({
				next: () => {
					this.router.navigate(['/stores']);
				},
				error: (error) => {
					console.error('Ошибка при обновлении:', error);

					if (error.status === 409) {
						this.errorMessage = 'Точка с такими данными уже существует.';
					} else {
						this.errorMessage = error.error?.message || 'Не удалось обновить торговую точку.';
					}
				}
			});
		}
	}

	// Логика для модальных окон
	openModal(field: 'building' | 'floor' | 'line' | 'storeNumber', mode: 'select' | 'add') {
		this.modalField = field;
		this.modalMode = mode;
		this.isModalOpen = true;
	}

	closeModal() {
		this.isModalOpen = false;
	}

	selectItem(item: any) {
		this.store[this.modalField] = item.name;
		this.closeModal();
	}

	addItem(newItem: any) {
		if (!newItem || !newItem.trim()) {
			this.errorMessage = 'Название не может быть пустым';
			return;
		}
		this.store[this.modalField] = newItem;
		this.closeModal();
	}
}
