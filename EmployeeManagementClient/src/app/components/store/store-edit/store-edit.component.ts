import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { HistoryService } from '../../../services/history.service';
import { UserService } from '../../../services/user.service';
import { Store } from '../../../models/store.model';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HistoryEntry, ChangeValue } from '../../../models/history.model';
import { ApplicationUser } from '../../../models/application-user.model';

@Component({
	selector: 'app-store-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, StoreSelectOrAddModalComponent],
	templateUrl: './store-edit.component.html',
	styleUrls: ['./store-edit.component.css']
})
export class StoreEditComponent implements OnInit {
	storeForm: FormGroup;
	originalStore: Store | null = null;
	storeId: number | null = null;
	isModalOpen = false;
	modalMode: 'select' | 'add' = 'select';
	modalField: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	errorMessage: string | null = null;
	historyEntries: HistoryEntry[] = [];
	isLoadingHistory = false;
	showHistory = false;
	userMap: { [key: string]: string } = {};

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private historyService: HistoryService,
		private userService: UserService,
		private http: HttpClient,
		private route: ActivatedRoute,
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
			isArchived: [false],
		});
	}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			if (params['id']) {
				this.storeId = Number(params['id']);
				this.loadStore(this.storeId);
				this.loadUsers();
			}
		});
	}

	private getAuthHeaders(): HttpHeaders {
		const token = localStorage.getItem('token');
		return new HttpHeaders({
			Authorization: token ? `Bearer ${token}` : '',
			'Content-Type': 'application/json',
		});
	}

	private loadUsers(): void {
		const user = this.userService.getCurrentUser();
		if (user && user.id && user.userName) {
			console.debug('Загружен текущий пользователь для userMap:', { id: user.id, userName: user.userName });
			this.userMap[user.id] = user.userName;
		} else {
			console.warn('Не удалось получить данные текущего пользователя:', user);
		}
	}

	navigateBack(): void {
		this.router.navigate(['/stores']);
	}

	loadStore(id: number): void {
		this.storeService.getStoreById(id).subscribe({
			next: (store) => {
				this.originalStore = { ...store };
				this.storeForm.patchValue({
					building: store.building,
					floor: store.floor,
					line: store.line,
					storeNumber: store.storeNumber,
					sortOrder: store.sortOrder,
					note: store.note || '',
					createdAt: store.createdAt,
					isArchived: store.isArchived,
				});
			},
			error: (error) => {
				console.error('Ошибка при загрузке торговой точки:', error);
				this.errorMessage = 'Не удалось загрузить торговую точку.';
			},
		});
	}

	isModified(): boolean {
		if (!this.originalStore) return false;
		const currentValue = this.storeForm.getRawValue();
		return (
			currentValue.building !== this.originalStore.building ||
			currentValue.floor !== this.originalStore.floor ||
			currentValue.line !== this.originalStore.line ||
			currentValue.storeNumber !== this.originalStore.storeNumber ||
			currentValue.sortOrder !== this.originalStore.sortOrder ||
			currentValue.note !== this.originalStore.note ||
			currentValue.isArchived !== this.originalStore.isArchived
		);
	}

	updateStore(): void {
		this.errorMessage = null;
		if (!this.isModified()) {
			this.errorMessage = 'Нет изменений для сохранения.';
			return;
		}
		if (this.storeId) {
			const updatedStore: Partial<Store> = {
				building: this.storeForm.get('building')?.value,
				floor: this.storeForm.get('floor')?.value,
				line: this.storeForm.get('line')?.value,
				storeNumber: this.storeForm.get('storeNumber')?.value,
				sortOrder: this.storeForm.get('sortOrder')?.value,
				note: this.storeForm.get('note')?.value,
				isArchived: this.storeForm.get('isArchived')?.value,
			};
			this.storeService.updateStore(this.storeId, updatedStore).subscribe({
				next: () => {
					this.router.navigate(['/stores']);
				},
				error: (error) => {
					console.error('Ошибка при обновлении:', error);
					this.errorMessage = error.error?.message || 'Не удалось обновить торговую точку.';
				},
			});
		}
	}

	archiveStore(): void {
		if (this.storeId) {
			this.storeService.archiveStore(this.storeId).subscribe({
				next: () => {
					this.storeForm.patchValue({ isArchived: true });
					this.loadStore(this.storeId!);
					if (this.showHistory) {
						this.loadHistory(this.storeId!.toString());
					}
				},
				error: (error) => {
					console.error('Ошибка при архивировании:', error);
					this.errorMessage = error.error?.message || 'Не удалось архивировать торговую точку.';
				},
			});
		}
	}

	unarchiveStore(): void {
		if (this.storeId) {
			this.storeService.unarchiveStore(this.storeId).subscribe({
				next: () => {
					this.storeForm.patchValue({ isArchived: false });
					this.loadStore(this.storeId!);
					if (this.showHistory) {
						this.loadHistory(this.storeId!.toString());
					}
				},
				error: (error) => {
					console.error('Ошибка при разархивировании:', error);
					this.errorMessage = error.error?.message || 'Не удалось разархивировать торговую точку.';
				},
			});
		}
	}

	loadHistory(storeId: string): void {
		this.isLoadingHistory = true;
		this.errorMessage = null;
		this.historyService.getHistory('store', storeId).subscribe({
			next: (historyEntries: HistoryEntry[]) => {
				console.debug('Загружено записей истории:', historyEntries.length);
				this.historyEntries = historyEntries;
				this.isLoadingHistory = false;
				if (historyEntries.length === 0) {
					console.debug(`История для магазина ${storeId} пуста`);
				}
			},
			error: (err) => {
				this.isLoadingHistory = false;
				console.error('Ошибка при загрузке истории:', err);
				this.errorMessage = err.message || 'Не удалось загрузить историю изменений.';
				this.historyEntries = [];
			},
		});
	}

	toggleHistory(): void {
		this.showHistory = !this.showHistory;
		if (this.showHistory && this.storeId && !this.historyEntries.length) {
			console.debug('Запрашиваем историю при переключении');
			this.loadHistory(this.storeId.toString());
		}
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

	formatHistoryChanges(changes: { [key: string]: ChangeValue } | undefined): string {
		if (!changes || !Object.keys(changes).length) {
			return 'Изменения отсутствуют';
		}

		return Object.entries(changes)
			.map(([key, value]) => {
				const fieldName = this.translateFieldName(key);
				const oldValue = value.oldValue ?? 'не указано';
				const newValue = value.newValue ?? 'не указано';
				return `${fieldName}: с "${oldValue}" на "${newValue}"`;
			})
			.join('; ');
	}

	private translateFieldName(field: string): string {
		const fieldTranslations: { [key: string]: string } = {
			building: 'Здание',
			floor: 'Этаж',
			line: 'Линия',
			storeNumber: 'Номер магазина',
			sortOrder: 'Порядок сортировки',
			note: 'Заметка',
			isArchived: 'Статус архивации',
		};
		return fieldTranslations[field] || field;
	}

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