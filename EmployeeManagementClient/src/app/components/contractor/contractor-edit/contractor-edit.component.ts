import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContractorEditService } from '../../../services/contractor-edit.service';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Contractor, Photo } from '../../../models/contractor.model';
import { HttpClientModule } from '@angular/common/http';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { CitizenshipAndNationalityModalComponent } from '../../modals/citizenship-and-nationality-modal/citizenship-and-nationality-modal.component';

@Component({
	selector: 'app-contractor-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxMaskDirective, HttpClientModule, CitizenshipAndNationalityModalComponent],
	providers: [provideNgxMask()],
	templateUrl: './contractor-edit.component.html',
	styleUrls: ['./contractor-edit.component.css']
})
export class ContractorEditComponent implements OnInit {
	contractorForm!: FormGroup;
	photoPreviews: { file: File | null, url: string, isDocumentPhoto: boolean }[] = [];
	existingPhotos: Photo[] = [];
	photosToRemove: number[] = [];
	contractorId!: string;
	documentPhotoPreviews: { file: File | null, url: string }[] = [];
	existingDocumentPhotos: Photo[] = [];
	isModalOpen = false;
	modalField: 'Citizenship' | 'Nationality' = 'Citizenship';
	modalMode: 'select' | 'add' = 'select';

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
			PhoneNumber: ['', Validators.required],
			IsArchived: [false],
			SortOrder: [null]
		});

		this.contractorForm.valueChanges.subscribe((value) => {
			console.log('Изменения в форме:', value);
		});
	}

	loadContractor(): void {
		this.contractorWatchService.getContractorById(this.contractorId).subscribe({
			next: (contractor: Contractor) => {
				console.log('Данные контрагента получены:', contractor);

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
					PhoneNumber: contractor.phoneNumber,
					IsArchived: contractor.isArchived,
					SortOrder: contractor.sortOrder
				});

				// Убрана проверка на $values
				const photos = contractor.photos || [];
				photos.forEach((photo: Photo) => {
					photo.filePath = photo.filePath.replace(/\\/g, '/');
				});

				this.existingPhotos = photos.filter((photo: Photo) => !photo.isDocumentPhoto);
				this.existingDocumentPhotos = photos.filter((photo: Photo) => photo.isDocumentPhoto);

				this.photoPreviews = this.existingPhotos.map((photo: Photo) => ({
					file: null,
					url: this.getFilePath(photo.filePath),
					isDocumentPhoto: false
				}));

				this.documentPhotoPreviews = this.existingDocumentPhotos.map((photo: Photo) => ({
					file: null,
					url: this.getFilePath(photo.filePath),
					isDocumentPhoto: true
				}));
			},
			error: (err) => {
				console.error('Ошибка при получении данных контрагента:', err);
			}
		});
	}

	openModal(field: 'Citizenship' | 'Nationality', mode: 'select' | 'add'): void {
		this.modalField = field;
		this.modalMode = mode;
		this.isModalOpen = true;
	}

	closeModal(): void {
		this.isModalOpen = false;
	}

	selectItem(item: { name: string }): void {
		this.contractorForm.patchValue({ [this.modalField]: item.name });
		this.closeModal();
	}

	addItem(item: { name: string }): void {
		this.contractorForm.patchValue({ [this.modalField]: item.name });
		this.closeModal();
	}

	onPhotoChange(event: Event, isDocumentPhoto: boolean): void {
		const files = (event.target as HTMLInputElement).files;
		if (files) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const reader = new FileReader();
				reader.onload = (e: any) => {
					const preview = {
						file,
						url: e.target.result,
						isDocumentPhoto
					};

					if (isDocumentPhoto) {
						this.documentPhotoPreviews.push(preview);
						console.log('Добавлено документальное фото:', preview);
					} else {
						this.photoPreviews.push(preview);
						console.log('Добавлено обычное фото:', preview);
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
			const removedPhoto = this.documentPhotoPreviews.splice(index, 1)[0];
			if (removedPhoto && removedPhoto.file === null) {
				const photoToRemove = this.existingDocumentPhotos.find(p => this.getFilePath(p.filePath) === removedPhoto.url);
				if (photoToRemove) {
					this.photosToRemove.push(photoToRemove.id);
				}
			}
		} else {
			const removedPhoto = this.photoPreviews.splice(index, 1)[0];
			if (removedPhoto && removedPhoto.file === null) {
				const photoToRemove = this.existingPhotos.find(p => this.getFilePath(p.filePath) === removedPhoto.url);
				if (photoToRemove) {
					this.photosToRemove.push(photoToRemove.id);
				}
			}
		}
		console.log('PhotosToRemove:', this.photosToRemove);
	}

	saveChanges(): void {
		if (this.contractorForm.invalid || !this.contractorId) {
			console.error('Форма невалидна или отсутствует ID контрагента');
			return;
		}

		const contractorData = { ...this.contractorForm.value };
		contractorData.BirthDate = new Date(contractorData.BirthDate).toISOString();
		contractorData.PassportIssueDate = new Date(contractorData.PassportIssueDate).toISOString();

		this.contractorService.updateContractor(this.contractorId, {
			...contractorData,
			Photos: this.photoPreviews.map(preview => preview.file).filter(Boolean),
			DocumentPhotos: this.documentPhotoPreviews.map(preview => preview.file).filter(Boolean),
			PhotosToRemove: this.photosToRemove
		}).subscribe({
			next: () => {
				console.log('Контрагент успешно обновлен.');
				this.router.navigate(['/contractors']);
			},
			error: (err) => {
				console.error('Ошибка при обновлении контрагента', err);
				if (err.error && err.error.errors) {
					console.error('Детали ошибок:', err.error.errors);
				}
			}
		});
	}
}
