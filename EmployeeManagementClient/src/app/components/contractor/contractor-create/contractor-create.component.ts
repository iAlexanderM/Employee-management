import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractorCreateService } from '../../../services/contractor-create.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
    selector: 'app-contractor-form',
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
        TextFieldModule,
    ],
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
	errorMessage: string | null = null;

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
			PhoneNumber: ['', Validators.required],
			IsArchived: [false],
			Note: [''],
			Photos: [''],
			DocumentPhotos: [''],
		});
	}

	ngOnInit(): void { }

	ngOnDestroy(): void {
		this.photoPreviews.forEach(url => URL.revokeObjectURL(url));
		this.documentPhotoPreviews.forEach(url => URL.revokeObjectURL(url));
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

	onPhotoChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			this.Photos = this.Photos.concat(Array.from(files));
			this.photoPreviews = this.photoPreviews.concat(
				Array.from(files).map(file => URL.createObjectURL(file))
			);
		}
		input.value = '';
	}

	onDocumentPhotosChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (files && files.length > 0) {
			this.DocumentPhotos = this.DocumentPhotos.concat(Array.from(files));
			this.documentPhotoPreviews = this.documentPhotoPreviews.concat(
				Array.from(files).map(file => URL.createObjectURL(file))
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

			contractorData.photos = this.Photos;
			contractorData.documentPhotos = this.DocumentPhotos;

			contractorData.BirthDate = new Date(contractorData.BirthDate).toISOString();
			contractorData.PassportIssueDate = new Date(contractorData.PassportIssueDate).toISOString();
			contractorData.PhoneNumber = contractorData.PhoneNumber.replace(/\D/g, '');

			this.contractorService.addContractor(contractorData).subscribe({
				next: () => {
					this.router.navigate(['/contractors']);
				},
				error: (err) => {
					console.error('Ошибка при добавлении контрагента', err);
					this.errorMessage = 'Не удалось создать контрагента. Попробуйте снова.';
				},
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}

	cancel(): void {
		this.contractorForm.reset();
		this.Photos = [];
		this.DocumentPhotos = [];
		this.photoPreviews = [];
		this.documentPhotoPreviews = [];
		this.router.navigate(['/contractors']);
	}
}