import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Contractor, Photo } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { TransformToUrlPipe } from '../../pipes/transform-to-url.pipe';

@Component({
	selector: 'app-contractor-details',
	standalone: true,
	imports: [CommonModule, TransformToUrlPipe, RouterModule],
	templateUrl: './contractor-details.component.html',
	styleUrls: ['./contractor-details.component.css']
})
export class ContractorDetailsComponent implements OnInit {
	contractor: Contractor | null = null;
	documentPhotoUrls: string[] = [];

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private contractorService: ContractorWatchService
	) { }

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id');
		if (id) {
			this.loadContractorData(id);
		}
	}

	loadContractorData(id: string): void {
		this.contractorService.getContractorById(id).subscribe({
			next: (data: Contractor) => {
				console.log('Полученные данные контрагента:', data);
				this.contractor = this.normalizePhotos(data);
				this.loadDocumentPhotos();
			},
			error: error => console.error('Ошибка при загрузке данных контрагента', error)
		});
	}

	normalizePhotos(contractor: Contractor): Contractor {
		// Убрана проверка на `$values`
		contractor.photos = Array.isArray(contractor.photos) ? contractor.photos : [];
		contractor.documentPhotos = Array.isArray(contractor.documentPhotos) ? contractor.documentPhotos : [];
		return contractor;
	}

	loadDocumentPhotos(): void {
		if (this.contractor?.photos) {
			const documentPhotos = this.contractor.photos.filter(photo => photo.isDocumentPhoto);
			this.documentPhotoUrls = documentPhotos.map(photo => this.transformToUrl(photo.filePath));
		}
	}

	getFirstPhoto(): string | null {
		if (this.contractor?.photos?.length) {
			const firstPhoto: Photo = this.contractor.photos[0];
			return this.transformToUrl(firstPhoto.filePath);
		}
		return null;
	}

	transformToUrl(filePath: string): string {
		return `http://localhost:8080/${filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '')}`;
	}

	editContractor(): void {
		if (this.contractor?.id) {
			console.log('Переход на редактирование контрагента с ID:', this.contractor.id);
			this.router.navigate([`/contractors/edit/${this.contractor.id}`]);
		}
	}

	formatPhoneNumber(phone: string): string {
		if (!phone) return '';

		const cleaned = phone.replace(/\D/g, '');

		if (cleaned.length === 11 && cleaned.startsWith('8')) {
			return cleaned.replace(/(\d)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1($2)$3-$4-$5');
		}

		return phone;
	}
}
