import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';

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

	constructor(private fb: FormBuilder, private storeService: StoreService, private router: Router) {
		this.storeForm = this.fb.group({
			building: [{ value: '', disabled: true }, Validators.required],
			floor: [{ value: '', disabled: true }, Validators.required],
			line: [{ value: '', disabled: true }, Validators.required],
			storeNumber: [{ value: '', disabled: true }, Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]],
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
				next: () => {
					console.log('Торговая точка успешно создана');
					this.router.navigate(['/stores']);
				},
				error: (error) => {
					console.error('Ошибка при создании торговой точки:', error);

					if (error.status === 409) {
						this.errorMessage = 'Торговая точка уже существует. Пожалуйста, выберите другое название.';
					} else {
						this.errorMessage = error.error?.message || 'Не удалось создать торговую точку. Попробуйте снова.';
					}
				},
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
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
}
