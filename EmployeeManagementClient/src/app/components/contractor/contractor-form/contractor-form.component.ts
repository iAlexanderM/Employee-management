import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContractorService } from '../../../services/contractor.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Contractor } from '../../../models/contractor.model';
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
	documentPhotos: string[] = [];
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
			photos: [''],
			documentPhotos: ['']
		});
	}

	ngOnInit(): void {
		this.contractorId = this.route.snapshot.paramMap.get('id');
		this.isEditMode = !!this.contractorId;

		if (this.contractorId) {
			this.contractorService.getContractorById(this.contractorId).subscribe({
				next: (data: Contractor) => {
					this.contractorForm.patchValue(data);
					this.documentPhotos = data.documentPhotos || [];
				},
				error: (error) => {
					console.error('Ошибка при загрузке данных контрагента', error);
				}
			});
		}
	}

	onPhotoChange(event: any): void {
		const files = event.target.files;
		if (files && files.length > 0) {
			const photos: string[] = [];
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const reader = new FileReader();
				reader.onload = () => {
					photos.push(reader.result as string);
				};
				reader.readAsDataURL(file);
			}
			this.contractorForm.patchValue({
				photos: photos
			});
		}
	}

	onDocumentPhotosChange(event: any): void {
		const files = event.target.files;
		if (files && files.length > 0) {
			const documentPhotos: string[] = [];
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				const reader = new FileReader();
				reader.onload = (e: any) => {
					this.documentPhotos.push(e.target.result);
				};
				reader.readAsDataURL(file);
			}
			this.contractorForm.patchValue({
				documentPhotos: documentPhotos
			});
		}
	}

	onSubmit(): void {
		if (this.contractorForm.valid) {
			const contractorData = { ...this.contractorForm.value, documentPhotos: this.documentPhotos };

			const formattedBirthDate = new Date(this.contractorForm.value.birthDate).toISOString();
			const formattedPassportIssueDate = new Date(this.contractorForm.value.passportIssueDate).toISOString();

			this.contractorForm.patchValue({
				birthDate: formattedBirthDate,
				passportIssueDate: formattedPassportIssueDate
			});

			if (this.contractorId != null) {
				this.contractorService.updateContractor(this.contractorId, contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (error) => {
						console.error('Ошибка при обновлении контрагента', error);
						console.log('Детали ошибки:', error.error.errors);
					},
				});
			} else {
				this.contractorService.addContractor(contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (error) => {
						console.error('Ошибка при добавлении контрагента', error);
						console.log('Детали ошибки:', error.error.errors);
						console.log(contractorData)
					},
				});
			}
		}
	}
}
