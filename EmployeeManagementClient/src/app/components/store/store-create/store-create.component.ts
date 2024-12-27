import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';

@Component({
	selector: 'app-store-create',
	standalone: true,
	imports: [CommonModule, FormsModule, StoreSelectOrAddModalComponent],
	templateUrl: './store-create.component.html',
	styleUrls: ['./store-create.component.css']
})
export class StoreCreateComponent {
	store: Store = { building: '', floor: '', line: '', storeNumber: '', sortOrder: 0, createdAt: new Date() };
	isModalOpen = false;
	modalMode: 'select' | 'add' = 'select';
	modalField: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	errorMessage: string | null = null; // Поле для отображения ошибки

	constructor(private storeService: StoreService, private router: Router) { }

	createStore(): void {
		this.errorMessage = null; // Сброс ошибки перед началом
		this.storeService.createStore(this.store).subscribe({
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
			}
		});
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
		this.store[this.modalField] = item.name;
		this.closeModal();
	}

	addItem(newItemName: string) {
		if (!newItemName.trim()) {
			this.errorMessage = 'Название не может быть пустым';
			return;
		}
		this.store[this.modalField] = newItemName;
		this.closeModal();
	}
}
