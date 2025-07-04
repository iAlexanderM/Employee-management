import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { HistoryService } from '../../../services/history.service';
import { AuthService } from '../../../services/auth.service';
import { Store } from '../../../models/store.model';
import { StoreSelectOrAddModalComponent } from '../../modals/store-select-or-add-modal/store-select-or-add-modal.component';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-store-create',
    imports: [CommonModule, ReactiveFormsModule, StoreSelectOrAddModalComponent],
    templateUrl: './store-create.component.html',
    styleUrls: ['./store-create.component.css']
})
export class StoreCreateComponent implements OnInit, OnDestroy {
	storeForm: FormGroup;
	isModalOpen = false;
	modalMode: 'select' | 'add' = 'select';
	modalField: 'building' | 'floor' | 'line' | 'storeNumber' = 'building';
	errorMessage: string | null = null;
	private subscriptions: Subscription[] = [];

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private historyService: HistoryService,
		private authService: AuthService,
		private router: Router
	) {
		this.storeForm = this.fb.group({
			building: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(50)]],
			floor: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
			line: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(10)]],
			storeNumber: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]],
			sortOrder: [0, [Validators.required, Validators.min(0)]],
			note: ['', [Validators.maxLength(500)]]
		});
	}

	ngOnInit(): void { }

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}

	createStore(): void {
		if (this.storeForm.invalid) {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
			return;
		}

		const store: Store = {
			id: 0,
			building: this.storeForm.get('building')?.value.trim(),
			floor: this.storeForm.get('floor')?.value.trim(),
			line: this.storeForm.get('line')?.value.trim(),
			storeNumber: this.storeForm.get('storeNumber')?.value.trim(),
			sortOrder: this.storeForm.get('sortOrder')?.value,
			isArchived: false,
			createdAt: new Date(),
			note: this.storeForm.get('note')?.value?.trim() || null
		};

		const subscription = this.storeService.createStore(store).subscribe({
			next: (createdStore) => {
				this.router.navigate(['/stores']);
			},
			error: (err) => {
				this.errorMessage = err.message || 'Не удалось создать торговую точку.';
			}
		});
		this.subscriptions.push(subscription);
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
		if (item?.name) {
			this.storeForm.patchValue({ [this.modalField]: item.name });
		}
		this.closeModal();
	}

	addItem(newItemName: string): void {
		if (!newItemName.trim()) {
			this.errorMessage = 'Название не может быть пустым.';
			return;
		}
		this.storeForm.patchValue({ [this.modalField]: newItemName });
		this.closeModal();
	}
}