import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContractorCreateService } from '../../../services/contractor-create.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { CitizenshipAndNationalityModalComponent } from '../../modals/citizenship-and-nationality-modal/citizenship-and-nationality-modal.component';

@Component({
	selector: 'app-contractor-form',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule, RouterModule, NgxMaskDirective, CitizenshipAndNationalityModalComponent],
	providers: [provideNgxMask()],
	templateUrl: './contractor-create.component.html',
	styleUrls: ['./contractor-create.component.css']
})
export class ContractorCreateComponent implements OnInit {
	contractorForm: FormGroup;
	contractorId: string | null = null;
	DocumentPhotos: File[] = [];
	Photos: File[] = [];
	photoPreviews: string[] = [];
	documentPhotoPreviews: string[] = [];
	isModalOpen = false;
	modalField: 'Citizenship' | 'Nationality' = 'Citizenship';
	modalMode: 'select' | 'add' = 'select';

	constructor(
		private fb: FormBuilder,
		private contractorService: ContractorCreateService,
		private router: Router,
		private route: ActivatedRoute
	) {
		this.contractorForm = this.fb.group({
			FirstName: ['', Validators.required],
			LastName: ['', Validators.required],
			MiddleName: [''],
			BirthDate: ['', Validators.required],
			DocumentType: ['', Validators.required],
			PassportSerialNumber: ['', Validators.required],
			PassportIssuedBy: ['', Validators.required],
			PassportIssueDate: ['', Validators.required],
			ProductType: ['', Validators.required],
			Citizenship: ['', Validators.required],
			Nationality: ['', Validators.required],
			PhoneNumber: ['', [Validators.required]],
			IsArchived: [false],
			Photos: [''],
			DocumentPhotos: ['']
		});
	}

	ngOnInit(): void { }

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

	onPhotoChange(event: any): void {
		const input = event.target;
		const files = input.files;
		if (files && files.length > 0) {
			this.Photos = this.Photos.concat(Array.from(files as FileList));
			this.photoPreviews = this.photoPreviews.concat(
				Array.from(files as FileList).map((file) => URL.createObjectURL(file))
			);
		}
		input.value = '';
	}

	onDocumentPhotosChange(event: any): void {
		const input = event.target;
		const files = input.files;
		if (files && files.length > 0) {
			this.DocumentPhotos = this.DocumentPhotos.concat(Array.from(files as FileList));
			this.documentPhotoPreviews = this.documentPhotoPreviews.concat(
				Array.from(files as FileList).map((file) => URL.createObjectURL(file))
			);
		}
		input.value = '';
	}

	removePhoto(index: number): void {
		this.Photos.splice(index, 1);
		this.photoPreviews.splice(index, 1);
	}

	removeDocumentPhoto(index: number): void {
		this.DocumentPhotos.splice(index, 1);
		this.documentPhotoPreviews.splice(index, 1);
	}

	onSubmit(): void {
		if (this.contractorForm.valid) {
			const contractorData = this.contractorForm.value;

			// Добавляем файлы в объект данных контрагента
			contractorData.photos = this.Photos;
			contractorData.documentPhotos = this.DocumentPhotos;

			// Преобразуем даты в формат UTC
			contractorData.BirthDate = new Date(contractorData.BirthDate).toISOString();
			contractorData.PassportIssueDate = new Date(contractorData.PassportIssueDate).toISOString();

			contractorData.PhoneNumber = contractorData.PhoneNumber.replace(/\D/g, '');

			this.contractorService.addContractor(contractorData).subscribe({
				next: () => this.router.navigate(['/contractors']),
				error: (err) => console.error('Ошибка при добавлении контрагента', err)
			});
		}
	}
}
