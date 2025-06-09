import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { TransactionService } from '../../../services/transaction.service';
import { HistoryService } from '../../../services/history.service';
import { AuthService } from '../../../services/auth.service';
import { PassService } from '../../../services/pass.service';
import { UserService } from '../../../services/user.service';
import { Contractor, ContractorDto } from '../../../models/contractor.model';
import { Pass } from '../../../models/pass.model';
import { HistoryEntry, ChangeValue } from '../../../models/history.model';
import { Subscription, merge, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-contractor-details',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		MatTableModule,
		MatIconModule,
	],
	templateUrl: './contractor-details.component.html',
	styleUrls: ['./contractor-details.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('modalFade', [
			transition(':enter', [
				style({ opacity: 0, transform: 'scale(0.95)' }),
				animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
			]),
			transition(':leave', [
				animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' })),
			]),
		]),
	],
})
export class ContractorDetailsComponent implements OnInit, OnDestroy {
	contractor: Contractor | null = null;
	documentPhotoUrls: string[] = [];
	visibleDocumentPhotoUrls: string[] = [];
	isGalleryOpen = false;
	currentGalleryIndex = 0;
	noteForm: FormGroup;
	historyEntries: HistoryEntry[] = [];
	isLoadingHistory = false;
	errorMessage: string | null = null;
	showHistory = false;
	userMap: { [key: string]: string } = {};
	private readonly apiBaseUrl = 'http://localhost:8080';
	private subscriptions: Subscription[] = [];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private contractorService: ContractorWatchService,
		private transactionService: TransactionService,
		private historyService: HistoryService,
		private userService: UserService,
		private authService: AuthService,
		private passService: PassService,
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
			this.loadUsersFromTransactions();
			this.loadCurrentUser();
			this.fetchContractorData(id);
		} else {
			this.errorMessage = 'ID контрагента не указан.';
			this.cdr.markForCheck();
		}
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	private loadCurrentUser(): void {
		const user = this.userService.getCurrentUser();
		if (user && user.id && user.userName) {
			this.userMap[user.id] = user.userName;
			console.debug('Current user added to userMap:', { id: user.id, name: user.userName });
		} else {
			console.warn('Не удалось загрузить текущего пользователя:', user);
		}
	}

	private loadUsersFromTransactions(): void {
		const sub = this.transactionService.searchTransactions({}, 1, 100).subscribe({
			next: (result) => {
				result.transactions.forEach((t: any) => {
					if (t.user && t.userId && t.user.userName) {
						this.userMap[t.userId] = t.user.userName;
					}
				});
				console.debug('userMap после загрузки транзакций:', this.userMap);
				this.cdr.markForCheck();
			},
			error: (err) => console.error('Ошибка загрузки пользователей из транзакций:', err),
		});
		this.subscriptions.push(sub);
	}

	private fetchContractorData(id: string): void {
		const sub = this.contractorService.getContractor(id).subscribe({
			next: (data: ContractorDto) => {
				this.contractor = this.normalizeContractorData(data);
				this.noteForm.patchValue({ note: this.contractor.note || '' });
				this.loadDocumentPhotos();
				console.debug('Пропуска для контрагента (после нормализации):', this.contractor.passes);
				if (this.showHistory) {
					this.loadHistory(id);
				}
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error('Ошибка загрузки контрагента:', err);
				this.errorMessage = 'Не удалось загрузить данные контрагента.';
				this.cdr.markForCheck();
			},
		});
		this.subscriptions.push(sub);
	}

	private normalizeContractorData(data: ContractorDto): Contractor {
		const activePasses = this.normalizePasses(data.activePasses || []);
		const closedPasses = this.normalizePasses(data.closedPasses || []);
		const passes = activePasses.concat(closedPasses);
		const photos = Array.isArray(data.photos) ? data.photos : [];
		const documentPhotos = Array.isArray(data.documentPhotos) ? data.documentPhotos : [];

		console.debug('Исходные данные контрагента:', data);
		console.debug('Пропуска:', passes);

		return {
			id: data.id,
			firstName: data.firstName || '',
			lastName: data.lastName || '',
			middleName: data.middleName || '',
			birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
			documentType: data.documentType || '',
			passportSerialNumber: data.passportSerialNumber || '',
			passportIssuedBy: data.passportIssuedBy || '',
			citizenship: data.citizenship || '',
			nationality: data.nationality || '',
			passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate) : undefined,
			productType: data.productType || '',
			phoneNumber: data.phoneNumber || '',
			createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
			sortOrder: data.sortOrder || 0,
			photos,
			documentPhotos,
			isArchived: data.isArchived || false,
			passes,
			activePasses,
			closedPasses,
			note: data.note,
		};
	}

	getFullStoreName(pass: Pass): string {
		const parts = [];
		if (pass.building) {
			parts.push(pass.building);
		}
		if (pass.floor) {
			parts.push(`${pass.floor}`);
		}
		if (pass.line) {
			parts.push(`${pass.line}`);
		}
		if (pass.storeNumber) {
			parts.push(`${pass.storeNumber}`);
		}

		if (parts.length === 0) {
			return 'Не указано';
		}

		return parts.join(', ');
	}

	private normalizePasses(passes: Pass[]): Pass[] {
		if (!Array.isArray(passes)) return [];
		return passes.map((p) => ({
			id: p.id,
			uniquePassId: p.uniquePassId || '',
			passTypeId: p.passTypeId,
			passType: p.passType,
			passTypeName: p.passTypeName || 'Unknown',
			contractorId: p.contractorId,
			contractor: p.contractor,
			cost: p.cost ?? 0,
			storeId: p.storeId,
			store: p.store,
			building: p.building,
			floor: p.floor,
			line: p.line,
			storeNumber: p.storeNumber,
			startDate: p.startDate ? new Date(p.startDate) : new Date(),
			endDate: p.endDate ? new Date(p.endDate) : new Date(),
			transactionDate: p.transactionDate ? new Date(p.transactionDate) : new Date(),
			isClosed: p.isClosed || false,
			closeReason: p.closeReason || '',
			closeDate: p.closeDate ? new Date(p.closeDate) : undefined,
			closedBy: p.closedBy || '',
			mainPhotoPath: p.mainPhotoPath || '',
			position: p.position || '',
			passTransaction: p.passTransaction,
			printStatus: p.printStatus,
			status: p.status || '',
			note: p.note || '',
		}));
	}

	getFirstPhoto(): string | null {
		const photo = this.contractor?.photos.find((p) => !p.isDocumentPhoto);
		return photo ? this.transformToUrl(photo.filePath) : null;
	}

	private loadDocumentPhotos(): void {
		this.documentPhotoUrls = this.contractor?.documentPhotos?.length
			? this.contractor.documentPhotos.map((photo) => this.transformToUrl(photo.filePath))
			: this.contractor?.photos
				.filter((photo) => photo.isDocumentPhoto)
				.map((photo) => this.transformToUrl(photo.filePath)) || [];
		this.visibleDocumentPhotoUrls = this.documentPhotoUrls.slice(-3);
		this.cdr.markForCheck();
	}

	private transformToUrl(filePath: string): string {
		return `${this.apiBaseUrl}/${filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '')}`;
	}

	formatPhoneNumber(phone: string): string {
		if (!phone) return 'Не указан';
		const cleaned = phone.replace(/\D/g, '');
		return cleaned.length === 11 && cleaned.startsWith('8')
			? cleaned.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1($2)$3-$4-$5')
			: phone;
	}

	getClosedByName(closedBy: string | undefined): string {
		if (!closedBy) {
			console.debug('closedBy отсутствует или пустой');
			return 'Неизвестно';
		}
		const name = this.userMap[closedBy] || closedBy;
		console.debug(`closedBy ${closedBy} mapped to name:`, name);
		return name;
	}

	closePass(passId: number): void {
		const pass = this.contractor?.passes?.find((p) => p.id === passId);
		if (!pass) {
			this.errorMessage = `Пропуск с ID ${passId} не найден.`;
			this.cdr.markForCheck();
			return;
		}
		if (pass.isClosed) {
			this.errorMessage = `Пропуск с ID ${passId} уже закрыт.`;
			this.cdr.markForCheck();
			return;
		}
		const reason = prompt('Укажите причину закрытия пропуска:');
		if (!reason) {
			this.errorMessage = 'Причина закрытия не указана.';
			this.cdr.markForCheck();
			return;
		}
		const user = this.userService.getCurrentUser();
		const closedBy = user?.id;
		if (!closedBy || !user?.userName) {
			console.warn('Не удалось определить пользователя:', user);
			this.errorMessage = 'Не удалось определить пользователя. Пожалуйста, войдите снова.';
			this.cdr.markForCheck();
			return;
		}
		const sub = this.passService.closePass(passId, reason, closedBy).subscribe({
			next: () => {
				console.debug('Пропуск успешно закрыт, closedBy:', closedBy, 'userName:', user.userName);
				pass.isClosed = true;
				pass.closeDate = new Date();
				pass.closeReason = reason;
				pass.closedBy = closedBy;
				this.userMap[closedBy] = user.userName;
				if (this.contractor) {
					this.loadHistory(this.contractor.id.toString());
				}
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error('Ошибка при закрытии пропуска:', err);
				this.errorMessage = 'Не удалось закрыть пропуск: ' + (err.error?.message || 'Неизвестная ошибка');
				this.cdr.markForCheck();
			},
		});
		this.subscriptions.push(sub);
	}

	reopenPass(passId: number): void {
		const pass = this.contractor?.passes?.find((p) => p.id === passId);
		if (!pass) {
			this.errorMessage = `Пропуск с ID ${passId} не найден.`;
			this.cdr.markForCheck();
			return;
		}
		if (!pass.isClosed) {
			this.errorMessage = `Пропуск с ID ${passId} уже открыт.`;
			this.cdr.markForCheck();
			return;
		}
		if (this.contractor) {
			const sub = this.passService.reopenPass(passId).subscribe({
				next: () => {
					pass.isClosed = false;
					pass.closeDate = undefined;
					pass.closeReason = undefined;
					pass.closedBy = undefined;
					if (this.contractor) {
						this.loadHistory(this.contractor.id.toString());
					}
					this.cdr.markForCheck();
				},
				error: (err) => {
					console.error('Ошибка при открытии пропуска:', err);
					this.errorMessage = 'Не удалось открыть пропуск: ' + (err.error?.message || 'Неизвестная ошибка');
					this.cdr.markForCheck();
				},
			});
			this.subscriptions.push(sub);
		}
	}

	archiveContractor(): void {
		if (!this.contractor) {
			this.errorMessage = 'Контрагент не загружен.';
			this.cdr.markForCheck();
			return;
		}
		const passes = this.contractor.passes;
		const hasActivePasses = passes.some((pass: Pass) => !pass.isClosed);
		if (hasActivePasses) {
			this.errorMessage = 'Нельзя заархивировать контрагента с активными пропусками.';
			this.cdr.markForCheck();
			return;
		}
		if (this.contractor.isArchived) {
			this.errorMessage = 'Контрагент уже заархивирован.';
			this.cdr.markForCheck();
			return;
		}
		const sub = this.contractorService.archiveContractor(this.contractor.id).subscribe({
			next: () => {
				if (this.contractor) {
					this.contractor.isArchived = true;
					this.loadHistory(this.contractor.id.toString());
				}
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error('Ошибка при архивировании контрагента:', err);
				this.errorMessage =
					'Не удалось заархивировать контрагента: ' + (err.error?.message || 'Неизвестная ошибка');
				this.cdr.markForCheck();
			},
		});
		this.subscriptions.push(sub);
	}

	unarchiveContractor(): void {
		if (!this.contractor) {
			this.errorMessage = 'Контрагент не загружен.';
			this.cdr.markForCheck();
			return;
		}
		if (!this.contractor.isArchived) {
			this.errorMessage = 'Контрагент уже разархивирован.';
			this.cdr.markForCheck();
			return;
		}
		const sub = this.contractorService.unarchiveContractor(this.contractor.id).subscribe({
			next: () => {
				if (this.contractor) {
					this.contractor.isArchived = false;
					this.loadHistory(this.contractor.id.toString());
				}
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error('Ошибка при разархивировании контрагента:', err);
				this.errorMessage =
					'Не удалось разархивировать контрагента: ' + (err.error?.message || 'Неизвестная ошибка');
				this.cdr.markForCheck();
			},
		});
		this.subscriptions.push(sub);
	}

	get note(): string {
		return this.noteForm.get('note')?.value || '';
	}

	saveNote(): void {
		if (!this.contractor) {
			this.errorMessage = 'Контрагент не загружен.';
			this.cdr.markForCheck();
			return;
		}
		const oldNote = this.contractor.note || '';
		if (this.note === oldNote) {
			this.errorMessage = 'Заметка не изменилась.';
			this.cdr.markForCheck();
			return;
		}
		const sub = this.contractorService.updateNote(this.contractor.id.toString(), this.note).subscribe({
			next: () => {
				if (this.contractor) {
					this.contractor.note = this.note;
					this.noteForm.markAsPristine();
					this.loadHistory(this.contractor.id.toString());
				}
				this.cdr.markForCheck();
			},
			error: (err) => {
				console.error('Ошибка при обновлении заметки:', err);
				this.errorMessage =
					'Не удалось обновить заметку: ' + (err.error?.message || 'Неизвестная ошибка');
				this.cdr.markForCheck();
			},
		});
		this.subscriptions.push(sub);
	}

	loadHistory(contractorId: string): void {
		this.isLoadingHistory = true;
		this.errorMessage = null;
		const sub = this.historyService.getHistory('contractor', contractorId).subscribe({
			next: (historyEntries: HistoryEntry[]) => {
				console.debug('Загружено записей истории:', historyEntries.length, historyEntries);
				this.historyEntries = historyEntries;
				this.isLoadingHistory = false;
				if (historyEntries.length === 0) {
					console.debug(`История для контрагента ${contractorId} пуста`);
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
		this.subscriptions.push(sub);
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

	toggleHistory(): void {
		this.showHistory = !this.showHistory;
		if (this.showHistory && this.contractor && !this.historyEntries.length) {
			console.debug('Запрашиваем историю при переключении');
			this.loadHistory(this.contractor.id.toString());
		}
		this.cdr.markForCheck();
	}

	openGallery(index: number): void {
		this.currentGalleryIndex = index;
		this.isGalleryOpen = true;
		this.cdr.markForCheck();
	}

	closeGallery(): void {
		this.isGalleryOpen = false;
		this.cdr.markForCheck();
	}

	navigateGallery(direction: 'prev' | 'next'): void {
		if (direction === 'prev' && this.currentGalleryIndex > 0) {
			this.currentGalleryIndex--;
		} else if (direction === 'next' && this.currentGalleryIndex < this.documentPhotoUrls.length - 1) {
			this.currentGalleryIndex++;
		}
		this.cdr.markForCheck();
	}

	getPassTypeName(pass: Pass): string {
		return `[${pass.passTypeId}] ${pass.passTypeName || 'Unknown'}`;
	}

	formatHistoryAction(action: string): string {
		const actionMap: { [key: string]: string } = {
			create: 'Создание',
			update: 'Обновление',
			delete: 'Удаление',
			archive: 'Архивирование',
			unarchive: 'Разархивирование',
			update_note: 'Изменение заметки',
			close_pass: 'Закрытие пропуска',
			reopen_pass: 'Открытие пропуска',
		};
		return actionMap[action.toLowerCase()] || action;
	}

	private translateFieldName(field: string): string {
		const fieldTranslations: { [key: string]: string } = {
			firstName: 'Имя',
			lastName: 'Фамилия',
			middleName: 'Отчество',
			birthDate: 'Дата рождения',
			documentType: 'Тип документа',
			passportSerialNumber: 'Серия и номер паспорта',
			passportIssuedBy: 'Кем выдан',
			passportIssueDate: 'Дата выдачи',
			citizenship: 'Гражданство',
			nationality: 'Национальность',
			productType: 'Тип продукции',
			phoneNumber: 'Номер телефона',
			isArchived: 'Статус архивации',
			sortOrder: 'Порядок сортировки',
			note: 'Заметка',
			photosRemoved: 'Удаленные фото',
			photosAdded: 'Добавленные фото',
			documentPhotosAdded: 'Добавленные фото документов',
		};
		return fieldTranslations[field] || field;
	}
}