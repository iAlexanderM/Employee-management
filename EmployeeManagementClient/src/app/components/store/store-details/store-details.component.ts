import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { HistoryService } from '../../../services/history.service';
import { AuthService } from '../../../services/auth.service';
import { Store } from '../../../models/store.model';
import { HistoryEntry } from '../../../models/history.model';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
	selector: 'app-store-details',
	standalone: true,
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
	],
})
export class StoreDetailsComponent implements OnInit {
	store: Store | null = null;
	noteForm: FormGroup;
	historyEntries: HistoryEntry[] = [];
	isLoadingHistory = false;
	errorMessage: string | null = null;
	showHistory = false;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storeService: StoreService,
		private historyService: HistoryService,
		private authService: AuthService,
		private fb: FormBuilder,
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
		}
	}

	navigateBack(): void {
		this.router.navigate(['/stores']);
	}

	loadStore(id: number): void {
		this.storeService.getStoreById(id).subscribe({
			next: (store) => {
				this.store = store;
				this.noteForm.patchValue({ note: store.note || '' });
				if (this.showHistory) {
					this.loadHistory(id.toString());
				}
				this.cdr.detectChanges();
			},
			error: (error) => {
				console.error('Ошибка при загрузке магазина:', error);
				this.errorMessage = 'Не удалось загрузить данные магазина.';
				this.cdr.detectChanges();
			},
		});
	}

	saveNote(): void {
		const note = this.noteForm.get('note')?.value;
		if (this.store && this.noteForm.valid) {
			const oldNote = this.store.note;
			this.storeService.updateStore(this.store.id.toString(), { note }).subscribe({
				next: () => {
					this.store = { ...this.store!, note };
					this.noteForm.markAsPristine();
					this.historyService
						.logHistory({
							entityType: 'store',
							entityId: this.store!.id.toString(),
							action: 'update_note',
							details: `Изменена заметка для магазина ${this.store!.id}`,
							changes: {
								note: {
									oldValue: oldNote || 'Нет',
									newValue: note || 'Нет',
								},
							},
							user: this.authService.getCurrentUser() || 'Unknown',
						})
						.subscribe({
							next: () => this.loadHistory(this.store!.id.toString()),
							error: (err) => {
								console.error('Ошибка при фиксации истории:', err);
								this.errorMessage = 'Не удалось зафиксировать историю изменений.';
								this.cdr.detectChanges();
							},
						});
					this.cdr.detectChanges();
				},
				error: (error) => {
					console.error('Ошибка при обновлении заметки:', error);
					this.errorMessage = error.error?.message || 'Не удалось сохранить заметку.';
					this.cdr.detectChanges();
				},
			});
		}
	}

	archiveStore(): void {
		if (this.store) {
			this.storeService.archiveStore(this.store.id).subscribe({
				next: () => {
					this.store = { ...this.store!, isArchived: true };
					this.historyService
						.logHistory({
							entityType: 'store',
							entityId: this.store!.id.toString(),
							action: 'archive',
							details: `Магазин ${this.store!.id} архивирован`,
							changes: {
								isArchived: {
									oldValue: false,
									newValue: true,
								},
							},
							user: this.authService.getCurrentUser() || 'Unknown',
						})
						.subscribe({
							next: () => this.loadHistory(this.store!.id.toString()),
							error: (err) => {
								console.error('Ошибка при фиксации истории:', err);
								this.errorMessage = 'Не удалось зафиксировать историю изменений.';
								this.cdr.detectChanges();
							},
						});
					this.cdr.detectChanges();
				},
				error: (error) => {
					console.error('Ошибка при архивировании:', error);
					this.errorMessage = error.error?.message || 'Не удалось архивировать магазин.';
					this.cdr.detectChanges();
				},
			});
		}
	}

	unarchiveStore(): void {
		if (this.store) {
			this.storeService.unarchiveStore(this.store.id).subscribe({
				next: () => {
					this.store = { ...this.store!, isArchived: false };
					this.historyService
						.logHistory({
							entityType: 'store',
							entityId: this.store!.id.toString(),
							action: 'unarchive',
							details: `Магазин ${this.store!.id} разархивирован`,
							changes: {
								isArchived: {
									oldValue: true,
									newValue: false,
								},
							},
							user: this.authService.getCurrentUser() || 'Unknown',
						})
						.subscribe({
							next: () => this.loadHistory(this.store!.id.toString()),
							error: (err) => {
								console.error('Ошибка при фиксации истории:', err);
								this.errorMessage = 'Не удалось зафиксировать историю изменений.';
								this.cdr.detectChanges();
							},
						});
					this.cdr.detectChanges();
				},
				error: (error) => {
					console.error('Ошибка при разархивировании:', error);
					this.errorMessage = error.error?.message || 'Не удалось разархивировать магазин.';
					this.cdr.detectChanges();
				},
			});
		}
	}

	loadHistory(storeId: string): void {
		this.isLoadingHistory = true;
		this.historyService.getHistory('store', storeId).subscribe({
			next: (entries) => {
				this.historyEntries = entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
				this.isLoadingHistory = false;
				console.log(`Loaded ${this.historyEntries.length} history entries for store ${storeId}`);
				this.cdr.detectChanges();
			},
			error: (error) => {
				this.isLoadingHistory = false;
				console.error('Ошибка при загрузке истории:', error);
				this.errorMessage = 'Не удалось загрузить историю изменений.';
				this.cdr.detectChanges();
			},
		});
	}

	toggleHistory(): void {
		this.showHistory = !this.showHistory;
		if (this.showHistory && this.store && !this.historyEntries.length) {
			this.loadHistory(this.store.id.toString());
		}
		this.cdr.detectChanges();
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