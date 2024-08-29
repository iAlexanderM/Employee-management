import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractorService } from '../../../services/contractor.service';

@Component({
	selector: 'app-contractor-form',
	templateUrl: './contractor-form.component.html',
	styleUrls: ['./contractor-form.component.css']
})
export class ContractorFormComponent implements OnInit {
	@Input() contractor: any;
	@Output() formSubmit = new EventEmitter<void>();

	contractorForm: FormGroup;
	errorMessage: string = '';

	constructor(private fb: FormBuilder, private contractorService: ContractorService) {
		this.contractorForm = this.fb.group({
			firstName: ['', Validators.required],
			lastName: ['', Validators.required],
			middleName: [''],
			birthDate: [''],
			documentType: [''],
			passportSeries: [''],
			passportNumber: [''],
			issuedBy: [''],
			issueDate: [''],
			productType: ['']
		});
	}

	ngOnInit(): void {
		if (this.contractor) {
			this.contractorForm.patchValue(this.contractor);
		}
	}

	submitForm(): void {
		if (this.contractorForm.valid) {
			if (this.contractor) {
				this.contractorService.updateContractor(this.contractor.id, this.contractorForm.value).subscribe(
					() => {
						this.formSubmit.emit();
					},
					(error) => {
						console.error('Error updating contractor', error);
						this.errorMessage = 'Ошибка при обновлении контрагента. Пожалуйста, попробуйте позже.';
					}
				);
			} else {
				this.contractorService.createContractor(this.contractorForm.value).subscribe(
					() => {
						this.formSubmit.emit();
					},
					(error) => {
						console.error('Error creating contractor', error);
						this.errorMessage = 'Ошибка при создании контрагента. Пожалуйста, попробуйте позже.';
					}
				);
			}
		}
	}

	onFileChange(event: any, field: string): void {
		const files = event.target.files;
		if (files.length > 0) {
			const formData = new FormData();
			for (let file of files) {
				formData.append(field, file);
			}
			// Загрузите файлы на сервер или обработайте их здесь
		}
	}
}
