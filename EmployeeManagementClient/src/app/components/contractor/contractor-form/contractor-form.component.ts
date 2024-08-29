import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractorService } from '../../../services/contractor.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Contractor } from '../../../models/contractor.model';

@Component({
	selector: 'app-contractor-form',
	templateUrl: './contractor-form.component.html',
	styleUrls: ['./contractor-form.component.css']
})
export class ContractorFormComponent implements OnInit {
	contractorForm: FormGroup;
	isEditMode: boolean = false;
	contractorId: string | null = null;

	constructor(
		private fb: FormBuilder,
		private contractorService: ContractorService,
		private route: ActivatedRoute,
		private router: Router
	) {
		this.contractorForm = this.fb.group({
			firstName: ['', Validators.required],
			lastName: ['', Validators.required],
			middleName: [''],
			dateOfBirth: ['', Validators.required],
			documentType: ['', Validators.required],
			passportSeries: ['', Validators.required],
			passportNumber: ['', Validators.required],
			passportIssuedBy: ['', Validators.required],
			passportIssueDate: ['', Validators.required],
			productType: ['', Validators.required],
			photo: [null],
			documentPhotos: [null],
		});
	}

	ngOnInit(): void {
		this.contractorId = this.route.snapshot.paramMap.get('id');
		if (this.contractorId) {
			this.isEditMode = true;
			this.contractorService.getContractorById(this.contractorId).subscribe(
				(contractor: Contractor) => {
					this.contractorForm.patchValue(contractor);
				},
				error => console.error('Ошибка при загрузке контрагента', error)
			);
		}
	}

	onSubmit(): void {
		if (this.contractorForm.valid) {
			if (this.isEditMode) {
				this.contractorService.updateContractor(this.contractorId!, this.contractorForm.value).subscribe(
					() => this.router.navigate(['/contractors']),
					error => console.error('Ошибка при обновлении контрагента', error)
				);
			} else {
				this.contractorService.createContractor(this.contractorForm.value).subscribe(
					() => this.router.navigate(['/contractors']),
					error => console.error('Ошибка при создании контрагента', error)
				);
			}
		}
	}

	// Метод для загрузки фото
	onFileChange(event: any, fieldName: string) {
		const file = event.target.files[0];
		if (file) {
			this.contractorForm.get(fieldName)?.setValue(file);
		}
	}
}
