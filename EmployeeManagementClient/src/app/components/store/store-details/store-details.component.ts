import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { HistoryService } from '../../../services/history.service';
import { AuthService } from '../../../services/auth.service';
import { Store } from '../../../models/store.model';
import { HistoryEntry } from '../../../models/history.model';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

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
export class StoreDetailsComponent implements OnInit, OnDestroy {
	store: Store | null = null;
	noteForm: FormGroup;
	historyEntries: HistoryEntry[] = [];
	isLoadingHistory = false;
	errorMessage: string | null = null;
	successMessage: string | null = null;
	showHistory = false;
	private subscriptions: Subscription[] = [];

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

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
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

		const oldNote = this.store.note;
		// Send full store data to satisfy server validation
		const storeUpdate: Partial<Store> = {
			building: this.store.building,
			floor: this.store.floor,
			line: this.store.line,
			storeNumber: this.store.storeNumber,
			note: note,
			sortOrder: this.store.sortOrder,
			isArchived: this.store.isArchived
		};
		const subscription = this.storeService.updateStore(this.store.id, storeUpdate).subscribe({
			next: () => {
				this.store = { ...this.store!, note };
				this.noteForm.patchValue({ note: note || '' });
				this.noteForm.markAsPristine();
				this.successMessage = 'Заметка успешно сохранена';
				const historySubscription = this.historyService
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
						next: () => {
							if (this.showHistory) {
								this.loadHistory(this.store!.id.toString());
							}
						},
						error: (err) => {
							this.errorMessage = 'Не удалось зафиксировать историю изменений.';
							this.cdr.detectChanges();
						},
					});
				this.subscriptions.push(historySubscription);
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
		this.historyService.getHistory('store', storeId).subscribe({
			next: (historyEntries: HistoryEntry[]) => {
				console.debug('Загружено записей истории:', historyEntries.length);
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
	}

	archiveStore(): void {
		if (!this.store) return;
		const subscription = this.storeService.archiveStore(this.store.id).subscribe({
			next: () => {
				const historySubscription = this.historyService
					.logHistory({
						entityType: 'store',
						entityId: this.store!.id.toString(),
						action: 'archive',
						details: `Магазин ${this.store!.id} архивирован`,
						changes: {
							isArchived: {
								oldValue: 'Активен',
								newValue: 'Заархивирован',
							},
						},
						user: this.authService.getCurrentUser() || 'Unknown',
					})
					.subscribe({
						next: () => {
							this.store = { ...this.store!, isArchived: true };
							if (this.showHistory) {
								this.loadHistory(this.store!.id.toString());
							}
							this.successMessage = 'Магазин успешно архивирован';
						},
						error: (err) => {
							this.errorMessage = 'Не удалось зафиксировать историю изменений.';
							this.cdr.detectChanges();
						},
					});
				this.subscriptions.push(historySubscription);
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
				const historySubscription = this.historyService
					.logHistory({
						entityType: 'store',
						entityId: this.store!.id.toString(),
						action: 'unarchive',
						details: `Магазин ${this.store!.id} разархивирован`,
						changes: {
							isArchived: {
								oldValue: 'Заархивирован',
								newValue: 'Активен',
							},
						},
						user: this.authService.getCurrentUser() || 'Unknown',
					})
					.subscribe({
						next: () => {
							this.store = { ...this.store!, isArchived: false };
							if (this.showHistory) {
								this.loadHistory(this.store!.id.toString());
							}
							this.successMessage = 'Магазин успешно разархивирован';
						},
						error: (err) => {
							this.errorMessage = 'Не удалось зафиксировать историю изменений.';
							this.cdr.detectChanges();
						},
					});
				this.subscriptions.push(historySubscription);
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
}