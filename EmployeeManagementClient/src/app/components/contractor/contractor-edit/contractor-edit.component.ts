import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContractorEditService } from '../../../services/contractor-edit.service';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Contractor, ContractorDto, Photo } from '../../../models/contractor.model';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { CitizenshipAndNationalityModalComponent } from '../../modals/citizenship-and-nationality-modal/citizenship-and-nationality-modal.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-contractor-edit',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		RouterModule,
		NgxMaskDirective,
		CitizenshipAndNationalityModalComponent,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatCheckboxModule,
		MatButtonModule,
		MatIconModule,
		MatGridListModule,
		MatTooltipModule,
	],
	providers: [provideNgxMask()],
	templateUrl: './contractor-edit.component.html',
	styleUrls: ['./contractor-edit.component.css']
})
export class ContractorEditComponent implements OnInit {
	contractorForm!: FormGroup;
	photoPreviews: { file: File | null; url: string; isDocumentPhoto: boolean }[] = [];
	existingPhotos: Photo[] = [];
	photosToRemove: number[] = [];
	contractorId!: string;
	documentPhotoPreviews: { file: File | null; url: string }[] = [];
	existingDocumentPhotos: Photo[] = [];
	isModalOpen = false;
	modalField: 'Citizenship' | 'Nationality' = 'Citizenship';
	modalMode: 'select' | 'add' = 'select';
	errorMessage: string | null = null;
	originalContractor: Contractor | null = null;

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
			SortOrder: [null],
			Note: ['', [Validators.maxLength(500)]],
		});

		this.contractorForm.valueChanges.subscribe((value) => {
			console.log('Изменения в форме:', value);
		});
	}

	private normalizeContractorData(data: ContractorDto): Contractor {
		const activePasses = data.activePasses || [];
		const closedPasses = data.closedPasses || [];
		const passes = activePasses.concat(closedPasses);
		const photos = Array.isArray(data.photos) ? data.photos : [];
		const documentPhotos = Array.isArray(data.documentPhotos) ? data.documentPhotos : [];

		return {
			id: data.id,
			firstName: data.firstName || '',
			lastName: data.lastName || '',
			middleName: data.middleName || '',
			birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
			documentType: data.documentType || '',
			passportSerialNumber: data.passportSerialNumber || '',
			passportIssuedBy: data.passportIssuedBy || '',
			citizenship: data.citizenship || '',
			nationality: data.nationality || '',
			passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate) : undefined,
			productType: data.productType || '',
			phoneNumber: data.phoneNumber || '',
			createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
			sortOrder: data.sortOrder || 0,
			photos,
			documentPhotos,
			isArchived: data.isArchived || false,
			passes,
			activePasses,
			closedPasses,
			note: data.note || '',
		};
	}

	loadContractor(): void {
		this.contractorWatchService.getContractor(this.contractorId).subscribe({
			next: (data: ContractorDto) => {
				console.log('Данные контрагента получены:', data);
				const contractor = this.normalizeContractorData(data);
				this.originalContractor = contractor;

				this.contractorForm.patchValue({
					FirstName: contractor.firstName,
					LastName: contractor.lastName,
					MiddleName: contractor.middleName,
					BirthDate: contractor.birthDate
						? contractor.birthDate.toISOString().slice(0, 10)
						: '',
					DocumentType: contractor.documentType,
					PassportSerialNumber: contractor.passportSerialNumber,
					PassportIssuedBy: contractor.passportIssuedBy,
					PassportIssueDate: contractor.passportIssueDate
						? contractor.passportIssueDate.toISOString().slice(0, 10)
						: '',
					Citizenship: contractor.citizenship,
					Nationality: contractor.nationality,
					ProductType: contractor.productType,
					PhoneNumber: contractor.phoneNumber,
					IsArchived: contractor.isArchived,
					SortOrder: contractor.sortOrder,
					Note: contractor.note,
				});

				const photos = contractor.photos || [];
				photos.forEach((photo: Photo) => {
					photo.filePath = photo.filePath.replace(/\\/g, '/');
				});

				this.existingPhotos = photos.filter((photo: Photo) => !photo.isDocumentPhoto);
				this.existingDocumentPhotos = photos.filter((photo: Photo) => photo.isDocumentPhoto);

				this.photoPreviews = this.existingPhotos.map((photo: Photo) => ({
					file: null,
					url: this.getFilePath(photo.filePath),
					isDocumentPhoto: false,
				}));

				this.documentPhotoPreviews = this.existingDocumentPhotos.map((photo: Photo) => ({
					file: null,
					url: this.getFilePath(photo.filePath),
				}));
			},
			error: (err: any) => {
				console.error('Ошибка при получении данных контрагента:', err);
				this.errorMessage = 'Не удалось загрузить данные контрагента.';
			},
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
						isDocumentPhoto,
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
				const photoToRemove = this.existingDocumentPhotos.find(
					(p) => this.getFilePath(p.filePath) === removedPhoto.url
				);
				if (photoToRemove) {
					this.photosToRemove.push(photoToRemove.id);
				}
			}
		} else {
			const removedPhoto = this.photoPreviews.splice(index, 1)[0];
			if (removedPhoto && removedPhoto.file === null) {
				const photoToRemove = this.existingPhotos.find(
					(p) => this.getFilePath(p.filePath) === removedPhoto.url
				);
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
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
			return;
		}

		const contractorData = { ...this.contractorForm.value };
		if (contractorData.BirthDate) {
			contractorData.BirthDate = new Date(contractorData.BirthDate).toISOString();
		}
		if (contractorData.PassportIssueDate) {
			contractorData.PassportIssueDate = new Date(contractorData.PassportIssueDate).toISOString();
		}

		contractorData.PhoneNumber = contractorData.PhoneNumber.replace(/\D/g, '');

		this.contractorService
			.updateContractor(this.contractorId, {
				...contractorData,
				Photos: this.photoPreviews.map((preview) => preview.file).filter(Boolean) as File[],
				DocumentPhotos: this.documentPhotoPreviews.map((preview) => preview.file).filter(Boolean) as File[],
				PhotosToRemove: this.photosToRemove,
			})
			.subscribe({
				next: () => {
					console.log('Контрагент успешно обновлен.');
					this.router.navigate(['/contractors']);
				},
				error: (err: any) => {
					console.error('Ошибка при обновлении контрагента', err);
					if (err.error && err.error.errors) {
						console.error('Детали ошибок:', err.error.errors);
						this.errorMessage = 'Ошибка при обновлении: ' + JSON.stringify(err.error.errors);
					} else if (err.error) {
						this.errorMessage = 'Ошибка при обновлении: ' + (err.error.message || JSON.stringify(err.error));
					} else {
						this.errorMessage = 'Не удалось обновить контрагента. Проверьте подключение и попробуйте снова.';
					}
				},
			});
	}

	cancel(): void {
		this.router.navigate(['/contractors']);
	}
}