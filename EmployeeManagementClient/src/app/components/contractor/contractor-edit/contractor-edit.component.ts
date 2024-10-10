import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContractorEditService } from '../../../services/contractorEdit.service';
import { ContractorWatchService } from '../../../services/contractorWatch.service';
import { Contractor, Photo } from '../../../models/contractor.model';
import { HttpClientModule } from '@angular/common/http';

@Component({
	selector: 'app-contractor-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
	templateUrl: './contractor-edit.component.html',
	styleUrls: ['./contractor-edit.component.css']
})
export class ContractorEditComponent implements OnInit {
	contractorForm!: FormGroup;
	photoPreviews: { file: File | null, url: string }[] = [];
	documentPhotoPreviews: { file: File | null, url: string }[] = [];
	existingPhotos: Photo[] = [];
	existingDocumentPhotos: Photo[] = [];
	contractorId!: string;

	private fb = inject(FormBuilder);
	private contractorService = inject(ContractorEditService);
	private contractorWatchService = inject(ContractorWatchService);
	public route = inject(ActivatedRoute);
	public router = inject(Router);

	ngOnInit(): void {
		this.contractorId = this.route.snapshot.paramMap.get('id')!;
		this.initializeForm();
		this.loadContractor();
	}

	private initializeForm(): void {
		this.contractorForm = this.fb.group({
			FirstName: ['', Validators.required],
			LastName: ['', Validators.required],
			MiddleName: [''],
			BirthDate: ['', Validators.required],
			DocumentType: ['', Validators.required],
			PassportSerialNumber: ['', Validators.required],
			PassportIssuedBy: ['', Validators.required],
			PassportIssueDate: ['', Validators.required],
			Citizenship: ['', Validators.required],
			Nationality: ['', Validators.required],
			ProductType: ['', Validators.required],
			IsArchived: [false]
		});
	}

	loadContractor(): void {
		this.contractorWatchService.getContractorById(this.contractorId).subscribe({
			next: (contractor: Contractor) => {
				console.log('Данные контрагента получены:', contractor);

				// Заполнение полей формы данными контрагента с форматированием даты
				this.contractorForm.patchValue({
					FirstName: contractor.firstName,
					LastName: contractor.lastName,
					MiddleName: contractor.middleName,
					BirthDate: contractor.birthDate ? new Date(contractor.birthDate).toISOString().slice(0, 10) : '',
					DocumentType: contractor.documentType,
					PassportSerialNumber: contractor.passportSerialNumber,
					PassportIssuedBy: contractor.passportIssuedBy,
					PassportIssueDate: contractor.passportIssueDate ? new Date(contractor.passportIssueDate).toISOString().slice(0, 10) : '',
					Citizenship: contractor.citizenship,
					Nationality: contractor.nationality,
					ProductType: contractor.productType,
					IsArchived: contractor.isArchived
				});

				const photos = (contractor.photos as any)?.$values || contractor.photos || [];
				photos.forEach((photo: Photo) => {
					photo.filePath = photo.filePath.replace(/\\/g, '/');
				});

				// Разделение фотографий на обычные и документальные
				this.existingPhotos = photos.filter((photo: Photo) => !photo.isDocumentPhoto);
				this.existingDocumentPhotos = photos.filter((photo: Photo) => photo.isDocumentPhoto);

				this.photoPreviews = this.existingPhotos.map((photo: Photo) => ({
					file: null,
					url: this.getFilePath(photo.filePath)
				}));

				this.documentPhotoPreviews = this.existingDocumentPhotos.map((photo: Photo) => ({
					file: null,
					url: this.getFilePath(photo.filePath)
				}));

				console.log('Загруженные фото:', this.photoPreviews);
				console.log('Загруженные документальные фото:', this.documentPhotoPreviews);
			},
			error: (err) => {
				console.error('Ошибка при получении данных контрагента:', err);
			}
		});
	}

	onPhotoChange(event: Event, isDocumentPhoto: boolean): void {
		const files = (event.target as HTMLInputElement).files;
		if (files) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const reader = new FileReader();
				reader.onload = (e: any) => {
					if (isDocumentPhoto) {
						this.documentPhotoPreviews.push({ file, url: e.target.result });
					} else {
						this.photoPreviews.push({ file, url: e.target.result });
					}
				};
				reader.readAsDataURL(file);
			}
		}
	}

	getFilePath(filePath: string): string {
		const formattedPath = filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '');
		return `http://localhost:8080/${formattedPath}`;
	}

	removePhoto(index: number, isDocumentPhoto: boolean): void {
		if (isDocumentPhoto) {
			this.documentPhotoPreviews.splice(index, 1);
		} else {
			this.photoPreviews.splice(index, 1);
		}
	}

	saveChanges(): void {
		if (this.contractorForm.valid && this.contractorId) {
			const contractorData = this.contractorForm.value;
			// Преобразуем даты в формат ISO
			contractorData.BirthDate = new Date(contractorData.BirthDate).toISOString();
			contractorData.PassportIssueDate = new Date(contractorData.PassportIssueDate).toISOString();

			const formData = new FormData();

			// Добавляем данные формы с учетом регистра ключей
			Object.keys(contractorData).forEach(key => {
				formData.append(key, contractorData[key]);
			});

			// Добавляем новые фотографии в FormData
			this.photoPreviews.forEach(preview => {
				if (preview.file) {
					formData.append('Photos', preview.file);
				}
			});

			this.documentPhotoPreviews.forEach(preview => {
				if (preview.file) {
					formData.append('DocumentPhotos', preview.file);
				}
			});

			// Добавляем существующие фотографии (URL)
			this.photoPreviews.forEach(preview => {
				if (!preview.file) {
					formData.append('ExistingPhotos', preview.url.replace(/\\/g, '/'));
				}
			});

			this.documentPhotoPreviews.forEach(preview => {
				if (!preview.file) {
					formData.append('ExistingDocumentPhotos', preview.url.replace(/\\/g, '/'));
				}
			});

			// Удаляем фотографии, которые были удалены пользователем
			const deletedPhotoIds = this.existingPhotos
				.filter(photo => !this.photoPreviews.some(preview => preview.url === photo.filePath))
				.map(photo => photo.id);

			const deletedDocumentPhotoIds = this.existingDocumentPhotos
				.filter(photo => !this.documentPhotoPreviews.some(preview => preview.url === photo.filePath))
				.map(photo => photo.id);

			// Добавляем ID удаленных фотографий в FormData
			formData.append('PhotosToRemove', JSON.stringify(deletedPhotoIds));
			formData.append('DocumentPhotosToRemove', JSON.stringify(deletedDocumentPhotoIds));

			// Логирование содержимого FormData для отладки
			formData.forEach((value, key) => {
				console.log(`${key}: ${value}`);
			});

			console.log('Данные формы перед отправкой:', this.contractorForm.value);

			this.contractorService.updateContractor(this.contractorId, formData).subscribe({
				next: () => this.router.navigate(['/contractors']),
				error: (err) => {
					console.error('Ошибка при обновлении контрагента', err);
					if (err.error && err.error.errors) {
						console.error('Детали ошибок:', err.error.errors);
					}
				}
			});
		}
	}
}
