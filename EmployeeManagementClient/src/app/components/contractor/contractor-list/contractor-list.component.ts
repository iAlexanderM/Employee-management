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
			next: (contractors: Contractor[]) => {
				if (Array.isArray(contractors)) {
					// Нормализуем данные контрагентов
					this.contractors = contractors.map(contractor => this.normalizePhotos(contractor));
				} else {
					console.error('Ожидался массив контрагентов, но получен:', contractors);
				}
			},
			error: (error: any) => console.error('Ошибка при загрузке списка контрагентов', error)
		});
	}

	// Метод для нормализации поля photos
	normalizePhotos(contractor: Contractor): Contractor {
		// Проверяем, если photos возвращены с ключом $values, приводим их к массиву объектов Photo
		if (contractor.photos && contractor.photos.hasOwnProperty('$values')) {
			contractor.photos = (contractor.photos as any).$values;
		}
		// Возвращаем обновленного контрагента
		return contractor;
	}

	// Метод для получения первой фотографии контрагента
	getFirstPhoto(contractor: Contractor): string | null {
		if (contractor.photos && Array.isArray(contractor.photos) && contractor.photos.length > 0) {
			// Формируем полный путь к фото, предполагая, что сервер работает на порту 5290
			return `http://localhost:5290/${contractor.photos[0].filePath}`;
		}
		return null; // Если нет фото, возвращаем null
	}
}
