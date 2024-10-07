import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContractorService } from '../../../services/contractor.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

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
	DocumentPhotos: File[] = [];
	Photos: File[] = [];
	isEditMode: boolean = false;

	constructor(
		private fb: FormBuilder,
		private contractorService: ContractorService,
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
			IsArchived: [false],
			Photos: [''],
			DocumentPhotos: ['']
		});
	}

	ngOnInit(): void {
		this.contractorId = this.route.snapshot.paramMap.get('id');
		this.isEditMode = !!this.contractorId;
		if (this.isEditMode && this.contractorId) {
			this.loadContractorData(this.contractorId);
		}
	}

	loadContractorData(id: string) {
		this.contractorService.getContractorById(id).subscribe({
			next: (data) => {
				const birthDate = new Date(data.birthDate).toISOString().slice(0, 10);
				const passportIssueDate = new Date(data.passportIssueDate).toISOString().slice(0, 10);
				this.contractorForm.patchValue({
					...data,
					BirthDate: birthDate,
					PassportIssueDate: passportIssueDate,
					Citizenship: data.citizenship, // Обновление поля Citizenship
					Nationality: data.nationality // Обновление поля Nationality
				});
			},
			error: (err) => console.error('Ошибка при загрузке данных контрагента', err)
		});
	}

	onPhotoChange(event: any): void {
		const files = event.target.files;
		if (files && files.length > 0) {
			this.Photos = Array.from(files);
		}
	}

	onDocumentPhotosChange(event: any): void {
		const files = event.target.files;
		if (files && files.length > 0) {
			this.DocumentPhotos = Array.from(files);
		}
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

			if (this.isEditMode && this.contractorId) {
				this.contractorService.updateContractor(this.contractorId, contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (err) => console.error('Ошибка при обновлении контрагента', err)
				});
			} else {
				this.contractorService.addContractor(contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (err) => console.error('Ошибка при добавлении контрагента', err)
				});
			}
		}
	}
}
