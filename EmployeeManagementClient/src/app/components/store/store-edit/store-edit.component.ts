import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { HistoryService } from '../../../services/history.service';
import { Store } from '../../../models/store.model';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';
import { AuthService } from '../../../services/auth.service';

@Component({
	selector: 'app-store-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, StoreSelectOrAddModalComponent],
	templateUrl: './store-edit.component.html',
	styleUrls: ['./store-edit.component.css'],
})
export class StoreEditComponent implements OnInit {
	storeForm: FormGroup;
	originalStore: Store | null = null;
	storeId: number | null = null;
	isModalOpen = false;
	modalMode: 'select' | 'add' = 'select';
	modalField: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	errorMessage: string | null = null;

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private historyService: HistoryService,
		private authService: AuthService,
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
			}
		});
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
					this.historyService
						.logHistory({
							entityType: 'store',
							entityId: this.storeId!.toString(),
							action: 'update',
							details: `Обновлены данные магазина ${this.storeId}`,
							changes: this.getChanges(),
							user: this.authService.getCurrentUser() || 'Unknown',
						})
						.subscribe({
							next: () => {
								this.router.navigate(['/stores']);
							},
							error: (err) => {
								console.error('Ошибка при фиксации истории:', err);
								this.errorMessage = 'Не удалось зафиксировать историю изменений.';
							},
						});
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
					this.historyService
						.logHistory({
							entityType: 'store',
							entityId: this.storeId!.toString(),
							action: 'archive',
							details: `Магазин ${this.storeId} архивирован`,
							changes: {
								isArchived: {
									oldValue: false,
									newValue: true,
								},
							},
							user: this.authService.getCurrentUser() || 'Unknown',
						})
						.subscribe({
							next: () => {
								this.loadStore(this.storeId!);
							},
							error: (err) => {
								console.error('Ошибка при фиксации истории:', err);
								this.errorMessage = 'Не удалось зафиксировать историю изменений.';
							},
						});
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
					this.historyService
						.logHistory({
							entityType: 'store',
							entityId: this.storeId!.toString(),
							action: 'unarchive',
							details: `Магазин ${this.storeId} разархивирован`,
							changes: {
								isArchived: {
									oldValue: true,
									newValue: false,
								},
							},
							user: this.authService.getCurrentUser() || 'Unknown',
						})
						.subscribe({
							next: () => {
								this.loadStore(this.storeId!);
							},
							error: (err) => {
								console.error('Ошибка при фиксации истории:', err);
								this.errorMessage = 'Не удалось зафиксировать историю изменений.';
							},
						});
				},
				error: (error) => {
					console.error('Ошибка при разархивировании:', error);
					this.errorMessage = error.error?.message || 'Не удалось разархивировать торговую точку.';
				},
			});
		}
	}

	private getChanges(): { [key: string]: { oldValue: any; newValue: any } } {
		const changes: { [key: string]: { oldValue: any; newValue: any } } = {};
		if (this.originalStore) {
			const currentValue = this.storeForm.getRawValue();
			Object.keys(currentValue).forEach((key) => {
				if (currentValue[key] !== this.originalStore![key]) {
					changes[key] = {
						oldValue: this.originalStore![key],
						newValue: currentValue[key],
					};
				}
			});
		}
		return changes;
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