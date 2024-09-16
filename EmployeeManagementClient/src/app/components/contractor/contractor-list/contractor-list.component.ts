import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContractorService } from '../../../services/contractor.service';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-contractor-list',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit {
	contractors: Contractor[] = [];

	constructor(private contractorService: ContractorService) { }

	ngOnInit(): void {
		this.contractorService.getContractors().subscribe({
			next: (data: Contractor[]) => {
				if (Array.isArray(data)) {
					// Нормализуем данные контрагентов
					this.contractors = data.map(contractor => this.normalizePhotos(contractor));
				} else {
					console.error('Ожидался массив, но получен объект', data);
				}
			},
			error: (error) => console.error('Ошибка при загрузке списка контрагентов', error)
		});
	}

	// Метод для нормализации поля photos
	normalizePhotos(contractor: Contractor): Contractor {
		if (contractor.photos && contractor.photos.hasOwnProperty('$values')) {
			contractor.photos = (contractor.photos as any).$values;
		}
		return contractor;
	}

	// Метод для получения первой фотографии контрагента
	getFirstPhoto(contractor: Contractor): string | null {
		if (contractor.photos && Array.isArray(contractor.photos) && contractor.photos.length > 0) {
			return contractor.photos[0];
		}
		return null; // Если нет фото, возвращаем null
	}
}
