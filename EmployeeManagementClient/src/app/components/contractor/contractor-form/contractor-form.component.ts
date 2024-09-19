import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContractorService } from '../../../services/contractor.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { Photo } from '../../../models/contractor.model'; 

@Component({
	selector: 'app-contractor-form',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule, RouterModule],
	templateUrl: './contractor-form.component.html',
	styleUrls: ['./contractor-form.component.css']
})
export class ContractorFormComponent implements OnInit {
	contractorForm: FormGroup;
	contractorId: string | null = null;
	photos: File[] = []; // Для загружаемых файлов
	existingPhotos: Photo[] = []; // Для уже существующих фотографий
	documentPhotos: File[] = []; // Для загружаемых файлов документов
	existingDocumentPhotos: Photo[] = []; // Для уже существующих фотографий документов
	isEditMode: boolean = false;

	constructor(
		private fb: FormBuilder,
		private contractorService: ContractorService,
		private router: Router,
		private route: ActivatedRoute
	) {
		this.contractorForm = this.fb.group({
			firstName: ['', Validators.required],
			lastName: ['', Validators.required],
			middleName: [''],
			birthDate: ['', Validators.required],
			documentType: ['', Validators.required],
			passportSerialNumber: ['', Validators.required],
			passportIssuedBy: ['', Validators.required],
			passportIssueDate: ['', Validators.required],
			productType: ['', Validators.required],
			photos: [''], // Для хранения загружаемых файлов фото
			documentPhotos: [''] // Для хранения загружаемых файлов документов
		});
	}

	ngOnInit(): void {
		this.contractorId = this.route.snapshot.paramMap.get('id');
		this.isEditMode = !!this.contractorId;

		// Если это режим редактирования, загружаем данные контрагента
		if (this.contractorId) {
			this.contractorService.getContractorById(this.contractorId).subscribe({
				next: (data: Contractor) => {
					// Преобразуем дату в строку и используем slice для формата yyyy-MM-dd
					const birthDate = data.birthDate ? new Date(data.birthDate).toISOString().slice(0, 10) : null;
					const passportIssueDate = data.passportIssueDate ? new Date(data.passportIssueDate).toISOString().slice(0, 10) : null;

					this.contractorForm.patchValue({
						...data,
						birthDate: birthDate,
						passportIssueDate: passportIssueDate,
					});
					// Заполняем существующие фото и документ-фото
					this.existingPhotos = data.photos || [];
					this.existingDocumentPhotos = data.documentPhotos || [];
				},
				error: (error) => {
					console.error('Ошибка при загрузке данных контрагента', error);
				}
			});
		}
	}

	// Обработчик изменения фото
	onPhotoChange(event: any): void {
		const files = event.target.files;
		if (files && files.length > 0) {
			this.photos = Array.from(files); // Сохраняем выбранные файлы
			this.contractorForm.patchValue({
				photos: this.photos
			});
		}
	}

	// Обработчик изменения фотографий документов
	onDocumentPhotosChange(event: any): void {
		const files = event.target.files;
		if (files && files.length > 0) {
			this.documentPhotos = Array.from(files); // Сохраняем выбранные файлы документов
			this.contractorForm.patchValue({
				documentPhotos: this.documentPhotos
			});
		}
	}

	// Метод для обработки отправки формы
	onSubmit(): void {
		if (this.contractorForm.valid) {
			// Подготовка данных перед отправкой
			const contractorData = { ...this.contractorForm.value };

			// Преобразование дат в формат ISO
			contractorData.birthDate = new Date(this.contractorForm.value.birthDate).toISOString();
			contractorData.passportIssueDate = new Date(this.contractorForm.value.passportIssueDate).toISOString();

			// В зависимости от режима, добавляем или обновляем контрагента
			if (this.contractorId != null) {
				// Добавляем фото и документ-фото к объекту contractorData
				contractorData.photos = this.photos;
				contractorData.documentPhotos = this.documentPhotos;

				this.contractorService.updateContractor(this.contractorId, contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (error) => {
						console.error('Ошибка при обновлении контрагента', error);
					},
				});
			} else {
				// Добавляем фото и документ-фото к объекту contractorData
				contractorData.photos = this.photos;
				contractorData.documentPhotos = this.documentPhotos;

				this.contractorService.addContractor(contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (error) => {
						console.error('Ошибка при добавлении контрагента', error);
					},
				});
			}
		}
	}
}
