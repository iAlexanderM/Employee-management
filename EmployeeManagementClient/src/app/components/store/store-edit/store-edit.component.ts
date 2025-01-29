import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';

@Component({
	selector: 'app-store-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, StoreSelectOrAddModalComponent],
	templateUrl: './store-edit.component.html',
	styleUrls: ['./store-edit.component.css']
})
export class StoreEditComponent implements OnInit {
	storeForm: FormGroup;
	originalStore: Store | null = null; // Оригинальные данные
	storeId: number | null = null;

	isModalOpen = false;
	modalMode: 'select' | 'add' = 'select';
	modalField: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	errorMessage: string | null = null; // Поле для отображения ошибки

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private route: ActivatedRoute,
		private router: Router
	) {
		// Инициализация формы с контролами и валидаторами
		this.storeForm = this.fb.group({
			building: [{ value: '', disabled: true }, Validators.required],
			floor: [{ value: '', disabled: true }, Validators.required],
			line: [{ value: '', disabled: true }, Validators.required],
			storeNumber: [{ value: '', disabled: true }, Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]],
			createdAt: [new Date(), Validators.required],
		});
	}

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
			this.originalStore = { ...store };
			this.storeForm.patchValue({
				building: store.building,
				floor: store.floor,
				line: store.line,
				storeNumber: store.storeNumber,
				sortOrder: store.sortOrder,
				createdAt: store.createdAt,
			});
		}, error => {
			console.error('Ошибка при загрузке торговой точки:', error);
			this.errorMessage = 'Не удалось загрузить торговую точку.';
		});
	}

	isModified(): boolean {
		if (!this.originalStore) return false;
		const currentValue = this.storeForm.getRawValue();
		return JSON.stringify(currentValue) !== JSON.stringify(this.originalStore);
	}

	updateStore(): void {
		this.errorMessage = null; // Сброс ошибки

		// Проверяем, были ли внесены изменения
		if (!this.isModified()) {
			this.errorMessage = 'Нет изменений для сохранения.';
			return;
		}

		if (this.storeId) {
			const updatedStore: Store = {
				...this.originalStore,
				...this.storeForm.getRawValue(),
			};

			this.storeService.updateStore(this.storeId, updatedStore).subscribe({
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
		this.storeForm.patchValue({
			[this.modalField]: item.name,
		});
		this.closeModal();
	}

	addItem(newItem: any) {
		if (!newItem || !newItem.trim()) {
			this.errorMessage = 'Название не может быть пустым';
			return;
		}
		this.storeForm.patchValue({
			[this.modalField]: newItem,
		});
		this.closeModal();
	}
}
