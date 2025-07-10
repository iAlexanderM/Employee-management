import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { Subscription } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PassPrintQueueItem } from '../../../models/pass-print-queue.model';
import { Photo } from '../../../models/contractor.model';

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
		MatProgressSpinnerModule
	],
	templateUrl: './contractor-details.component.html',
	styleUrls: ['./contractor-details.component.css'],
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
	]
})
export class ContractorDetailsComponent implements OnInit, OnDestroy, AfterViewInit {
	@ViewChild('noteTextarea') noteTextarea!: ElementRef<HTMLTextAreaElement>;

	contractor: Contractor | null = null;
	documentPhotoUrls: string[] = [];
	nonDocumentPhotoUrls: string[] = [];
	visibleDocumentPhotoUrls: string[] = [];
	isGalleryOpen = false;
	currentGalleryIndex = 0;
	currentGalleryPhotos: string[] = [];
	currentGalleryType: 'document' | 'nonDocument' | null = null;

	noteForm: FormGroup;
	historyEntries: HistoryEntry[] = [];
	isLoadingHistory = false;
	errorMessage: string | null = null;
	showHistory = false;
	userMap: { [key: string]: string } = {};
	private readonly apiBaseUrl = 'http://localhost:8080';
	private subscriptions: Subscription[] = [];
	issuedPasses: PassPrintQueueItem[] = [];
	totalPasses: number = 0;

	displayedColumns: string[] = [
		'passType',
		'store',
		'position',
		'cost',
		'transactionDate',
		'startDate',
		'endDate',
		'status',
		'actions',
	];
	historyColumns: string[] = ['timestamp', 'action', 'user', 'details', 'changes'];

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
		private cdr: ChangeDetectorRef,
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

	ngAfterViewInit(): void {
		const textarea = this.noteTextarea.nativeElement;
		const adjustHeight = () => {
			textarea.style.height = 'auto';
			textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
		};
		textarea.addEventListener('input', adjustHeight);
		adjustHeight();
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach((sub) => sub.unsubscribe());
	}

	private loadCurrentUser(): void {
		const user = this.userService.getCurrentUser();
		if (user && user.id && user.userName) {
			this.userMap[user.id] = user.userName;
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
				this.cdr.markForCheck();
			},
			error: (err) => console.error('Ошибка загрузки пользователей из транзакций:', err),
		});
		this.subscriptions.push(sub);
	}

	private fetchContractorData(id: string): void {
		const sub = this.contractorService.getContractor(id).subscribe({
			next: (data: ContractorDto) => {
				console.log('Contractor Passes from Backend:', JSON.stringify(data.passes, null, 2));
				this.contractor = this.normalizeContractorData(data);
				this.noteForm.patchValue({ note: this.contractor.note || '' });
				this.loadDocumentPhotos();
				this.loadNonDocumentPhotos();
				if (this.showHistory) {
					this.loadHistory(id);
				}
				this.cdr.detectChanges();
			},
			error: (err) => {
				console.error('Error fetching contractor:', err);
				this.errorMessage = 'Не удалось загрузить данные контрагента.';
				this.cdr.markForCheck();
			},
		});
		this.subscriptions.push(sub);
	}

	private normalizeContractorData(data: ContractorDto): Contractor {
		const activePasses = this.normalizePasses(data.activePasses || []);
		const closedPasses = this.normalizePasses(data.closedPasses || []);
		const additionalPasses = this.normalizePasses(data.passes || []);
		const passes = [...activePasses, ...closedPasses, ...additionalPasses].filter(
			(pass, index, self) => self.findIndex((p) => p.id === pass.id) === index
		);
		const photos = Array.isArray(data.photos) ? data.photos : [];
		const documentPhotos = Array.isArray(data.documentPhotos) ? data.documentPhotos : [];

		console.log('Normalized Passes:', passes);

		return {
			id: data.id,
			firstName: data.firstName || '',
			lastName: data.lastName || '',
			middleName: data.middleName || '',
			birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
			documentType: data.documentType || '',
			passportSerialNumber: data.passportSerialNumber || '',
			passportIssuedBy: data.passportIssuedBy || '',
			passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate) : undefined,
			citizenship: data.citizenship || '',
			nationality: data.nationality || '',
			productType: data.productType || '',
			phoneNumber: data.phoneNumber || '',
			createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
			sortOrder: data.sortOrder || 0,
			photos,
			documentPhotos,
			isArchived: data.isArchived || false,
			passes,
			activePasses: passes.filter((p) => !p.isClosed),
			closedPasses: passes.filter((p) => p.isClosed),
			note: data.note,
		};
	}

	getFullStoreName(pass: Pass): string {
		const parts: string[] = [];
		if (pass.building) parts.push(pass.building);
		if (pass.floor) parts.push(`${pass.floor}`);
		if (pass.line) parts.push(`${pass.line}`);
		if (pass.storeNumber) parts.push(`${pass.storeNumber}`);

		return parts.length ? parts.join(', ') : 'Не указано';
	}

	private normalizePasses(passes: Pass[]): Pass[] {
		if (!Array.isArray(passes)) {
			console.warn('Passes is not an array:', passes);
			return [];
		}
		return passes.map((p) => {
			const closeDateRaw = p.closeDate || null;
			const closeDate = closeDateRaw ? new Date(closeDateRaw) : p.isClosed ? new Date() : undefined;
			const closedBy = p.closedByUserId || p.closedBy || '';
			if (p.closedByUser?.userName && p.closedByUserId) {
				this.userMap[p.closedByUserId] = p.closedByUser.userName;
			}
			console.log('Processing Pass:', {
				id: p.id,
				closeDateRaw: closeDateRaw,
				parsedCloseDate: closeDate,
				isClosed: p.isClosed,
				closeReason: p.closeReason,
				closedBy: closedBy,
				closedByUserId: p.closedByUserId,
				closedByUser: p.closedByUser,
				passStatus: p.passStatus,
				rawPass: p,
			});
			return {
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
				isClosed: p.isClosed || p.passStatus === 'Closed' || false,
				closeReason: p.closeReason || '',
				closeDate,
				closedBy,
				closedByUserId: p.closedByUserId,
				closedByUser: p.closedByUser,
				passStatus: p.passStatus,
				mainPhotoPath: p.mainPhotoPath || '',
				position: p.position || '',
				passTransaction: p.passTransaction,
				printStatus: p.printStatus,
				status: p.status || '',
				note: p.note || '',
			};
		});
	}

	getMainDisplayPhoto(): { url: string; index: number } | null {
		const nonDocumentPhotos = (this.contractor?.photos || [])
			.filter((photo: Photo) => !photo.isDocumentPhoto);

		if (nonDocumentPhotos.length > 0) {
			const lastPhoto = nonDocumentPhotos[nonDocumentPhotos.length - 1];
			const urlToFind = this.transformToUrl(lastPhoto.filePath);
			const indexInSortedList = this.nonDocumentPhotoUrls.findIndex(url => url === urlToFind);

			return {
				url: urlToFind,
				index: indexInSortedList !== -1 ? indexInSortedList : 0
			};
		}
		return null;
	}

	private loadDocumentPhotos(): void {
		this.documentPhotoUrls = (this.contractor?.documentPhotos || this.contractor?.photos || [])
			.filter((photo: Photo) => photo.isDocumentPhoto)
			.map((photo: Photo) => this.transformToUrl(photo.filePath))
			.sort((a, b) => {
				const idA = this.getIdFromUrl(a);
				const idB = this.getIdFromUrl(b);
				return idA - idB;
			});

		this.visibleDocumentPhotoUrls = this.documentPhotoUrls.slice(-3);
		this.cdr.markForCheck();
	}

	private loadNonDocumentPhotos(): void {
		this.nonDocumentPhotoUrls = (this.contractor?.photos || [])
			.filter((photo: Photo) => !photo.isDocumentPhoto)
			.map((photo: Photo) => this.transformToUrl(photo.filePath))
			.sort((a, b) => {
				const idA = this.getIdFromUrl(a);
				const idB = this.getIdFromUrl(b);
				return idA - idB;
			});
		this.cdr.markForCheck();
	}

	private getIdFromUrl(url: string): number {
		const match = url.match(/\/(\d+)\.(png|jpg|jpeg|gif)$/i);
		return match ? parseInt(match[1], 10) : 0;
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
		if (!closedBy) return 'Неизвестно';
		return this.userMap[closedBy] || closedBy;
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
			this.errorMessage = 'Не удалось определить пользователя. Пожалуйста, войдите снова.';
			this.cdr.markForCheck();
			return;
		}
		const sub = this.passService.closePass(passId, reason, closedBy).subscribe({
			next: () => {
				if (this.contractor) {
					this.fetchContractorData(this.contractor.id.toString());
					this.loadHistory(this.contractor.id.toString());
				}
			},
			error: (err) => {
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
					if (this.contractor) {
						this.fetchContractorData(this.contractor.id.toString());
						this.loadHistory(this.contractor.id.toString());
					}
				},
				error: (err) => {
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
				this.errorMessage = 'Не удалось обновить заметку: ' + (err.error?.message || 'Неизвестная ошибка');
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
				this.historyEntries = historyEntries;
				this.isLoadingHistory = false;
				this.cdr.markForCheck();
			},
			error: (err) => {
				this.isLoadingHistory = false;
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
			this.loadHistory(this.contractor.id.toString());
		}
		this.cdr.markForCheck();
	}

	openGallery(index: number, type: 'document' | 'nonDocument'): void {
		console.log('openGallery called with:', { index, type });
		console.log('Current nonDocumentPhotoUrls:', this.nonDocumentPhotoUrls);
		console.log('Current documentPhotoUrls:', this.documentPhotoUrls);

		this.currentGalleryType = type;

		if (type === 'document') {
			this.currentGalleryPhotos = this.documentPhotoUrls;
		} else { // type === 'nonDocument'
			this.currentGalleryPhotos = this.nonDocumentPhotoUrls;
		}

		console.log('currentGalleryPhotos after assignment:', this.currentGalleryPhotos);

		if (this.currentGalleryPhotos.length === 0) {
			this.isGalleryOpen = false;
			console.warn(`No photos available for gallery type: ${type}. Gallery will not open.`);
			return;
		}

		if (index < 0 || index >= this.currentGalleryPhotos.length) {
			console.warn(`Attempted to open gallery with invalid index: ${index} for type: ${type}. Max index: ${this.currentGalleryPhotos.length - 1}. Resetting to 0.`);
			this.currentGalleryIndex = 0;
		} else {
			this.currentGalleryIndex = index;
		}

		this.isGalleryOpen = true;
		this.cdr.markForCheck();

		console.log('Gallery state after openGallery:', {
			isGalleryOpen: this.isGalleryOpen,
			currentGalleryIndex: this.currentGalleryIndex,
			currentGalleryPhotosLength: this.currentGalleryPhotos.length
		});
		console.log('URL that should be displayed:', this.currentGalleryPhotos[this.currentGalleryIndex]);
	}

	closeGallery(): void {
		this.isGalleryOpen = false;
		this.cdr.markForCheck();
	}

	navigateGallery(direction: 'prev' | 'next'): void {
		if (direction === 'prev' && this.currentGalleryIndex > 0) {
			this.currentGalleryIndex--;
		} else if (direction === 'next' && this.currentGalleryIndex < this.currentGalleryPhotos.length - 1) {
			this.currentGalleryIndex++;
		}
		this.cdr.markForCheck();
	}

	getPassTypeName(pass: Pass): string {
		return `[${pass.passTypeId}] ${pass.passTypeName || 'Unknown'}`;
	}

	watchAllPasses(): void {
		if (!this.contractor || !this.contractor.id) {
			this.errorMessage = 'Контрагент не найден или отсутствует ID.';
			this.cdr.markForCheck();
			return;
		}
		const contractorId = this.contractor.id;
		this.router.navigate(['/passes/issued'], { queryParams: { contractorId } });
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
			note: 'Пометка',
			photosRemoved: 'Удаленные фото',
			photosAdded: 'Добавленные фото',
			documentPhotosAdded: 'Добавленные фото документов',
		};
		return fieldTranslations[field] || field;
	}
}