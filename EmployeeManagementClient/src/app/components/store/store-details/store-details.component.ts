import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { HistoryService } from '../../../services/history.service';
import { AuthService } from '../../../services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Store } from '../../../models/store.model';
import { HistoryEntry, ChangeValue } from '../../../models/history.model';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { UserService } from '../../../services/user.service';

@Component({
    selector: 'app-store-details',
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './store-details.component.html',
    styleUrls: ['./store-details.component.css'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-out', style({ opacity: 1 })),
            ]),
        ]),
    ]
})
export class StoreDetailsComponent implements OnInit, OnDestroy {
	store: Store | null = null;
	noteForm: FormGroup;
	historyEntries: HistoryEntry[] = [];
	isLoadingHistory = false;
	errorMessage: string | null = null;
	successMessage: string | null = null;
	showHistory = false;
	userMap: { [key: string]: string } = {};
	private subscriptions: Subscription[] = [];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storeService: StoreService,
		private historyService: HistoryService,
		private authService: AuthService,
		private userService: UserService,
		private fb: FormBuilder,
		private http: HttpClient,
		private cdr: ChangeDetectorRef
	) {
		this.noteForm = this.fb.group({
			note: ['', [Validators.maxLength(500)]],
		});
	}

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id');
		if (id) {
			this.loadStore(Number(id));
			this.loadUsers();
		}
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
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
			this.userMap[user.id] = user.userName;
			console.debug('userMap:', this.userMap);
			console.debug('Есть ли пользователь 60808ee9-e697-42bd-9bf1-2218c0c2a382:', this.userMap['60808ee9-e697-42bd-9bf1-2218c0c2a382']);
			this.cdr.markForCheck();
		} else {
			console.warn('Не удалось получить данные текущего пользователя из UserService:', user);
		}
	}

	navigateBack(): void {
		this.router.navigate(['/stores']);
	}

	loadStore(id: number): void {
		const subscription = this.storeService.getStoreById(id).subscribe({
			next: (store) => {
				this.store = store;
				this.noteForm.patchValue({ note: store.note || '' });
				if (this.showHistory) {
					this.loadHistory(id.toString());
				}
				this.cdr.detectChanges();
			},
			error: (error) => {
				this.errorMessage = 'Не удалось загрузить данные магазина.';
				this.cdr.detectChanges();
			},
		});
		this.subscriptions.push(subscription);
	}

	saveNote(): void {
		if (!this.store || !this.noteForm.valid) return;

		const note = this.noteForm.get('note')?.value?.trim() || null;
		if (note === this.store.note) return;

		const storeUpdate: Partial<Store> = {
			building: this.store.building,
			floor: this.store.floor,
			line: this.store.line,
			storeNumber: this.store.storeNumber,
			note: note,
			sortOrder: this.store.sortOrder,
			isArchived: this.store.isArchived,
		};
		const subscription = this.storeService.updateStore(this.store.id, storeUpdate).subscribe({
			next: () => {
				this.store = { ...this.store!, note };
				this.noteForm.patchValue({ note: note || '' });
				this.noteForm.markAsPristine();
				this.successMessage = 'Заметка успешно сохранена';
				if (this.showHistory) {
					this.loadHistory(this.store!.id.toString());
				}
				this.cdr.detectChanges();
			},
			error: (err) => {
				this.errorMessage = 'Ошибка при сохранении заметки: ' + (err.message || 'Неизвестная ошибка');
				this.cdr.detectChanges();
			},
		});
		this.subscriptions.push(subscription);
	}

	toggleHistory(): void {
		this.showHistory = !this.showHistory;
		if (this.showHistory && this.store) {
			this.loadHistory(this.store.id.toString());
		} else {
			this.historyEntries = [];
		}
		this.cdr.detectChanges();
	}

	loadHistory(storeId: string): void {
		this.isLoadingHistory = true;
		this.errorMessage = null;
		const subscription = this.historyService.getHistory('store', storeId).subscribe({
			next: (historyEntries: HistoryEntry[]) => {
				console.debug('Загружены записи истории:', historyEntries);
				this.historyEntries = historyEntries;
				this.isLoadingHistory = false;
				if (historyEntries.length === 0) {
					console.debug(`История для торговой точки ${storeId} пуста`);
				}
				this.cdr.markForCheck();
			},
			error: (err) => {
				this.isLoadingHistory = false;
				console.error('Ошибка при загрузке истории:', err);
				this.errorMessage = err.message || 'Не удалось загрузить историю изменений.';
				this.historyEntries = [];
				this.cdr.markForCheck();
			},
		});
		this.subscriptions.push(subscription);
	}

	archiveStore(): void {
		if (!this.store) return;
		const subscription = this.storeService.archiveStore(this.store.id).subscribe({
			next: () => {
				this.store = { ...this.store!, isArchived: true };
				if (this.showHistory) {
					this.loadHistory(this.store!.id.toString());
				}
				this.successMessage = 'Магазин успешно архивирован';
				this.cdr.detectChanges();
			},
			error: (err) => {
				this.errorMessage = 'Ошибка при архивировании магазина: ' + (err.message || 'Неизвестная ошибка');
				this.cdr.detectChanges();
			},
		});
		this.subscriptions.push(subscription);
	}

	unarchiveStore(): void {
		if (!this.store) return;
		const subscription = this.storeService.unarchiveStore(this.store.id).subscribe({
			next: () => {
				this.store = { ...this.store!, isArchived: false };
				if (this.showHistory) {
					this.loadHistory(this.store!.id.toString());
				}
				this.successMessage = 'Магазин успешно разархивирован';
				this.cdr.detectChanges();
			},
			error: (err) => {
				this.errorMessage = 'Ошибка при разархивировании магазина: ' + (err.message || 'Неизвестная ошибка');
				this.cdr.detectChanges();
			},
		});
		this.subscriptions.push(subscription);
	}

	editStore(): void {
		if (this.store) {
			this.router.navigate([`/stores/edit/${this.store.id}`]);
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
}