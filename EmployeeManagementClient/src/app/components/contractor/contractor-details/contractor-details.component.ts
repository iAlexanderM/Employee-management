import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../../services/transaction.service';
import { Contractor, Photo } from '../../../models/contractor.model';
import { Pass } from '../../../models/pass.model';

@Component({
	selector: 'app-contractor-details',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './contractor-details.component.html',
	styleUrls: ['./contractor-details.component.css']
})
export class ContractorDetailsComponent implements OnInit {
	contractor: Contractor | null = null;
	documentPhotoUrls: string[] = [];
	photoSizeClass: string = '';
	enlargedPhotoUrl: string | null = null;
	private storesCache: { [key: number]: any } = {};
	private userMap: { [key: string]: string } = {}; // Кэш UUID -> UserName
	private readonly apiBaseUrl = 'http://localhost:8080';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private http: HttpClient,
		private transactionService: TransactionService
	) { }

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id');
		if (id) {
			this.loadUsersFromTransactions(); // Загружаем пользователей
			this.fetchContractorData(id);
		}
	}

	private loadUsersFromTransactions(): void {
		this.transactionService.searchTransactions({}, 1, 100).subscribe({
			next: (result) => {
				result.transactions.forEach((t: any) => {
					if (t.user) {
						this.userMap[t.userId] = t.user.userName || 'Неизвестно';
					}
				});
				console.log('Загруженные пользователи:', this.userMap);
			},
			error: (err) => console.error('Ошибка загрузки пользователей:', err)
		});
	}

	private fetchContractorData(id: string): void {
		this.http
			.get<any>(`${this.apiBaseUrl}/api/contractors/${id}`, {
				headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
			})
			.subscribe({
				next: (data) => {
					console.log('Данные с бэкенда:', data);
					this.contractor = this.normalizeContractorData(data);
					this.loadDocumentPhotos();
					this.fetchStoresForPasses();
					console.log('Пропуска после нормализации:', this.contractor.passes);
				},
				error: (err) => console.error('Ошибка загрузки контрагента:', err)
			});
	}

	private normalizeContractorData(data: any): Contractor {
		return {
			id: data.id,
			firstName: data.firstName,
			lastName: data.lastName,
			middleName: data.middleName || '',
			birthDate: new Date(data.birthDate),
			documentType: data.documentType,
			passportSerialNumber: data.passportSerialNumber,
			passportIssuedBy: data.passportIssuedBy,
			citizenship: data.citizenship,
			nationality: data.nationality,
			passportIssueDate: new Date(data.passportIssueDate),
			productType: data.productType,
			phoneNumber: data.phoneNumber,
			createdAt: new Date(data.createdAt),
			sortOrder: data.sortOrder || 0,
			photos: Array.isArray(data.photos) ? data.photos : [],
			documentPhotos: Array.isArray(data.documentPhotos) ? data.documentPhotos : [],
			isArchived: data.isArchived || false,
			passes: this.normalizePasses(data.passes),
			note: data.note || ''
		};
	}

	private normalizePasses(passes: any[]): Pass[] {
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
			storeFullName: p.store ? this.formatStoreFullName(p.store) : undefined,
			startDate: new Date(p.startDate),
			endDate: new Date(p.endDate),
			transactionDate: new Date(p.transactionDate),
			isClosed: p.isClosed || false,
			closeReason: p.closeReason || '',
			closeDate: p.closeDate ? new Date(p.closeDate) : undefined,
			closedBy: p.closedBy || '',
			mainPhotoPath: p.mainPhotoPath || '',
			position: p.position || '',
			passTransaction: p.passTransaction,
			printStatus: p.printStatus,
			status: p.status || '',
			note: p.note || ''
		}));
	}

	private fetchStoresForPasses(): void {
		if (!this.contractor?.passes?.length) return;

		const uniqueStoreIds = [...new Set(this.contractor.passes.map((pass) => pass.storeId))];
		uniqueStoreIds.forEach((storeId) => {
			if (!this.storesCache[storeId] && !this.contractor?.passes.some((p) => p.storeId === storeId && p.store)) {
				this.http
					.get<any>(`${this.apiBaseUrl}/api/store/${storeId}`, {
						headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
					})
					.subscribe({
						next: (storeData) => {
							this.storesCache[storeId] = storeData;
							this.updatePassesWithStore(storeId, storeData);
							console.log(`Данные магазина ${storeId}:`, storeData);
						},
						error: (err) => {
							console.error(`Ошибка загрузки магазина ${storeId}:`, err);
							this.updatePassesWithFallback(storeId);
						}
					});
			}
		});
	}

	private updatePassesWithStore(storeId: number, storeData: any): void {
		if (this.contractor?.passes) {
			this.contractor.passes = this.contractor.passes.map((pass) => {
				if (pass.storeId === storeId && !pass.storeFullName) {
					pass.storeFullName = this.formatStoreFullName(storeData);
				}
				return pass;
			});
		}
	}

	private updatePassesWithFallback(storeId: number): void {
		if (this.contractor?.passes) {
			this.contractor.passes = this.contractor.passes.map((pass) => {
				if (pass.storeId === storeId && !pass.storeFullName) {
					pass.storeFullName = `Торговая точка ${storeId}`;
				}
				return pass;
			});
		}
	}

	private formatStoreFullName(store: any): string {
		if (store && typeof store === 'object') {
			return '[+PLACE_ZDANIE+] [+PLACE_ETAJH+] [+PLACE_LINIA+] [+PLACE_TOCHKA+]'
				.replace('[+PLACE_ZDANIE+]', store.building || 'N/A')
				.replace('[+PLACE_ETAJH+]', store.floor || '')
				.replace('[+PLACE_LINIA+]', store.line || '')
				.replace('[+PLACE_TOCHKA+]', store.storeNumber || 'N/A')
				.replace('[+PLACE_ZONA+]', '');
		}
		return 'Торговая точка неизвестно';
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
		this.photoSizeClass = this.documentPhotoUrls.length > 2 ? 'small-photos' : '';
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
		return closedBy ? this.userMap[closedBy] || closedBy : 'Неизвестно';
	}

	closePass(passId: number): void {
		const reason = prompt('Укажите причину закрытия пропуска:');
		if (reason) {
			console.log(`Закрытие пропуска ${passId} с причиной: ${reason}`);
			this.http
				.post(`${this.apiBaseUrl}/api/pass/${passId}/close`, { closeReason: reason }, {
					headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
				})
				.subscribe({
					next: () => {
						console.log(`Пропуск ${passId} закрыт`);
						this.fetchContractorData(this.contractor!.id.toString());
					},
					error: (err) => console.error('Ошибка закрытия пропуска:', err)
				});
		}
	}

	togglePhotoEnlargement(photoUrl: string, event: Event): void {
		event.preventDefault();
		this.enlargedPhotoUrl = this.enlargedPhotoUrl === photoUrl ? null : photoUrl;
	}

	shrinkPhoto(event: Event): void {
		const target = event.target as HTMLElement;
		if (!target.closest('.img-cont') && !target.closest('.document-photo')) {
			this.enlargedPhotoUrl = null;
		}
	}

	getPassTypeName(pass: Pass): string {
		return `[${pass.passTypeId}] ${pass.passTypeName || 'Unknown'}`;
	}
}