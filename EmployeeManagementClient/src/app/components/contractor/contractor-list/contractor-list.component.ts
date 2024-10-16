import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContractorWatchService } from '../../../services/contractorWatch.service';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

@Component({
	selector: 'app-contractor-list',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule, RouterModule, NgxMaskDirective],
	providers: [provideNgxMask()],
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit {
	contractors: Contractor[] = [];
	searchForm: FormGroup;

	constructor(
		private contractorService: ContractorWatchService,
		private fb: FormBuilder
	) {
		// Инициализация формы поиска с полями
		this.searchForm = this.fb.group({
			Id: [''],
			FirstName: [''],
			LastName: [''],
			MiddleName: [''],
			BirthDate: [''],
			DocumentType: [''],
			PassportSerialNumber: [''],
			PassportIssuedBy: [''],
			PassportIssueDate: [''],
			ProductType: [''],
			PhoneNumber: [''],
			Citizenship: [''],
			Nationality: ['']
		});
	}

	ngOnInit(): void {
		this.loadContractors();
	}

	// Метод для загрузки всех контрагентов
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

	searchContractors(): void {
		const searchParams = this.searchForm.value;

		if (searchParams.BirthDate) {
			searchParams.BirthDate = new Date(searchParams.BirthDate).toISOString();
		}

		if (searchParams.PassportIssueDate) {
			searchParams.PassportIssueDate = new Date(searchParams.PassportIssueDate).toISOString();
		}

		if (searchParams.PhoneNumber) {
			searchParams.PhoneNumber = searchParams.PhoneNumber.replace(/\D/g, '');
		}

		console.log('Параметры поиска:', searchParams);

		this.contractorService.searchContractors(searchParams).subscribe({
			next: (response: any) => {
				console.log('Результаты поиска контрагентов:', response);

				if (response && response.hasOwnProperty('$values')) {
					this.contractors = response.$values.map((contractor: Contractor) => this.normalizePhotos(contractor));
				} else {
					this.contractors = Array.isArray(response) ? response.map((contractor: Contractor) => this.normalizePhotos(contractor)) : [];
				}
			},
			error: (error: any) => console.error('Ошибка при выполнении поиска контрагентов', error)
		});
	}


	resetFilters(): void {
		this.searchForm.reset(); // Сброс формы
		this.loadContractors(); // Загрузка всех контрагентов
	}

	// Метод для нормализации поля photos
	normalizePhotos(contractor: Contractor): Contractor {
		if (contractor.photos && contractor.photos.hasOwnProperty('$values')) {
			contractor.photos = (contractor.photos as any).$values;
		}
		console.log('Photos после нормализации:', contractor.photos);
		return contractor;
	}

	// Получение первой фотографии контрагента для отображения в таблице
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
