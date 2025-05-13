import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { HistoryService } from '../../../services/history.service';
import { Store } from '../../../models/store.model';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';
import { HistoryEntry } from '../../../models/history.model';

@Component({
	selector: 'app-store-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, StoreSelectOrAddModalComponent],
	templateUrl: './store-create.component.html',
	styleUrls: ['./store-create.component.css'],
})
export class StoreCreateComponent {
	storeForm: FormGroup;
	isModalOpen = false;
	modalMode: 'select' | 'add' = 'select';
	modalField: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	errorMessage: string | null = null;
	showHistory = false;
	historyEntries: HistoryEntry[] = [];
	isLoadingHistory = false;

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private historyService: HistoryService,
		private router: Router
	) {
		this.storeForm = this.fb.group({
			building: [{ value: '', disabled: true }, Validators.required],
			floor: [{ value: '', disabled: true }, Validators.required],
			line: [{ value: '', disabled: true }, Validators.required],
			storeNumber: [{ value: '', disabled: true }, Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]],
			note: ['', [Validators.maxLength(500)]],
			createdAt: [new Date(), Validators.required],
		});
	}

	createStore(): void {
		this.errorMessage = null;

		if (this.storeForm.valid) {
			const newStore: Store = {
				...this.storeForm.getRawValue(),
			};

			this.storeService.createStore(newStore).subscribe({
				next: (response) => {
					console.log('Торговая точка успешно создана', response);
					this.router.navigate(['/stores']);
				},
				error: (error) => {
					console.error('Ошибка при создании торговой точки:', error);
					if (error.status === 409) {
						this.errorMessage = 'Торговая точка с такой локацией уже существует.';
					} else {
						this.errorMessage = error.error?.message || 'Не удалось создать торговую точку.';
					}
				},
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}

	navigateBack(): void {
		this.router.navigate(['/stores']);
	}

	openModal(field: 'building' | 'floor' | 'line' | 'storeNumber', mode: 'select' | 'add'): void {
		this.modalField = field;
		this.modalMode = mode;
		this.isModalOpen = true;
	}

	closeModal(): void {
		this.isModalOpen = false;
	}

	selectItem(item: { name: string }): void {
		if (item && item.name) {
			this.storeForm.patchValue({
				[this.modalField]: item.name,
			});
		}
		this.closeModal();
	}

	addItem(newItemName: string): void {
		if (!newItemName.trim()) {
			this.errorMessage = 'Название не может быть пустым.';
			return;
		}
		this.storeForm.patchValue({
			[this.modalField]: newItemName,
		});
		this.closeModal();
	}

	toggleHistory(): void {
		this.showHistory = !this.showHistory;
		if (this.showHistory && this.historyEntries.length === 0) {
			this.loadHistory();
		}
	}

	loadHistory(): void {
		this.isLoadingHistory = true;
		this.historyService.getHistory('store', 'temp').subscribe({
			next: (entries) => {
				this.historyEntries = entries.sort((a, b) =>
					b.timestamp.getTime() - a.timestamp.getTime()
				);
				this.isLoadingHistory = false;
				console.log(`Loaded ${this.historyEntries.length} history entries`);
			},
			error: (error) => {
				this.isLoadingHistory = false;
				console.error('Ошибка при загрузке истории:', error);
				this.errorMessage = 'Не удалось загрузить историю изменений.';
			},
		});
	}

	formatHistoryAction(action: string): string {
		const actionMap: { [key: string]: string } = {
			create: 'Создание',
			update: 'Обновление',
			archive: 'Архивирование',
			unarchive: 'Разархивирование',
			update_note: 'Изменение заметки',
		};
		return actionMap[action.toLowerCase()] || action;
	}

	formatHistoryChanges(changes: { [key: string]: { oldValue: any; newValue: any } } | undefined): string {
		if (!changes || !Object.keys(changes).length) {
			return 'Изменения отсутствуют';
		}
		return Object.entries(changes)
			.map(([key, value]) => {
				const fieldName = this.translateFieldName(key);
				return `${fieldName}: с "${value.oldValue || 'не указано'}" на "${value.newValue || 'не указано'}"`;
			})
			.join('; ');
	}

	translateFieldName(key: string): string {
		const fieldMap: { [key: string]: string } = {
			building: 'Здание',
			floor: 'Этаж',
			line: 'Линия',
			storeNumber: 'Торговая точка',
			sortOrder: 'Порядок сортировки',
			note: 'Заметка',
			isArchived: 'Статус архивации',
		};
		return fieldMap[key] || key;
	}
}