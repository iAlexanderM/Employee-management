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
			dateOfBirth: ['', Validators.required],
			documentType: ['', Validators.required],
			passportSeries: ['', Validators.required],
			passportNumber: ['', Validators.required],
			passportIssuedBy: ['', Validators.required],
			passportIssueDate: ['', Validators.required],
			productType: ['', Validators.required],
			photo: [''],
			documentPhotos: ['']
		});
	}

	ngOnInit(): void {
		this.contractorId = this.route.snapshot.paramMap.get('id');
		this.isEditMode = !!this.contractorId;

		if (this.contractorId) {
			this.contractorService.getContractorById(this.contractorId).subscribe(
				(data: Contractor) => {
					this.contractorForm.patchValue(data);
					this.documentPhotos = data.documentPhotos || [];
				},
				error => console.error('Ошибка при загрузке данных контрагента', error)
			);
		}
	}

	onFileChange(event: any): void {
		const files = event.target.files;
		if (files) {
			for (let i = 0; i < files.length; i++) {
				const reader = new FileReader();
				reader.onload = (e: any) => {
					this.documentPhotos.push(e.target.result);
				};
				reader.readAsDataURL(files[i]);
			}
		}
	}

	onSubmit(): void {
		if (this.contractorForm.valid) {
			const contractorData = { ...this.contractorForm.value, documentPhotos: this.documentPhotos };

			if (this.contractorId) {
				this.contractorService.updateContractor(this.contractorId, contractorData).subscribe(
					() => this.router.navigate(['/contractors']),
					error => console.error('Ошибка при обновлении контрагента', error)
				);
			} else {
				this.contractorService.addContractor(contractorData).subscribe(
					() => this.router.navigate(['/contractors']),
					error => console.error('Ошибка при добавлении контрагента', error)
				);
			}
		}
	}
}
