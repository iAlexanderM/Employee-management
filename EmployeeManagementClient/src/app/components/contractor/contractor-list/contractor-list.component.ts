import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContractorWatchService } from '../../../services/contractorWatch.service';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
	selector: 'app-contractor-list',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit {
	contractors: Contractor[] = [];

	constructor(private contractorService: ContractorWatchService) { }

	ngOnInit(): void {
		this.loadContractors();
	}

	loadContractors(): void {
		this.contractorService.getContractors().subscribe({
			next: (contractors: Contractor[]) => {
				console.log('Полученные контрагенты:', contractors);
				if (Array.isArray(contractors)) {
					this.contractors = contractors.map(contractor => this.normalizePhotos(contractor));
					console.log('Нормализованные данные контрагентов:', this.contractors);
				} else {
					console.error('Ожидался массив контрагентов, но получен:', contractors);
				}
			},
			error: (error: any) => console.error('Ошибка при загрузке списка контрагентов', error)
		});
	}

	// Метод для нормализации поля photos
	normalizePhotos(contractor: Contractor): Contractor {
		if (contractor.photos && contractor.photos.hasOwnProperty('$values')) {
			contractor.photos = (contractor.photos as any).$values;
		}
		console.log('Photos после нормализации:', contractor.photos);
		return contractor;
	}

	getFirstPhoto(contractor: Contractor): string | null {
		if (contractor.photos && Array.isArray(contractor.photos) && contractor.photos.length > 0) {
			const filePath = contractor.photos[0].filePath
				.replace(/\\/g, '/') // Заменяем обратные слэши на прямые
				.replace(/^.*wwwroot\//, ''); // Убираем все, что до 'wwwroot/'

			return `http://localhost:8080/${filePath}`;
		}
		return null;
	}
}