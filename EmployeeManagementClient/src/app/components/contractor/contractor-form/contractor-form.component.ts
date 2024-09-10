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
	documentPhotos: string[] = [];  // Хранение base64 представления фото
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
			photo: [''],  // Для хранения base64 фото
			documentPhotos: ['']  // Для хранения base64 файлов документов
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

	onFileChange(event: any): void {
		const files = event.target.files;
		if (files && files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				const file = files[i];

				// Для отображения предварительного просмотра и хранения base64
				const reader = new FileReader();
				reader.onload = (e: any) => {
					this.documentPhotos.push(e.target.result);  // Добавляем base64 в массив documentPhotos
				};
				reader.readAsDataURL(file);
			}
		}
	}

	onSubmit(): void {
		if (this.contractorForm.valid) {
			const contractorData = { ...this.contractorForm.value, documentPhotos: this.documentPhotos };

			// Функция для форматирования даты
			const formatDate = (dateString: string) => {
				const date = new Date(dateString);
				const day = date.getDate().toString().padStart(2, '0');
				const month = (date.getMonth() + 1).toString().padStart(2, '0');
				const year = date.getFullYear().toString();
				return `${day}.${month}.${year}`;
			};

			// Форматируем даты перед отправкой на сервер
			contractorData.dateOfBirth = formatDate(this.contractorForm.value.dateOfBirth);
			contractorData.passportIssueDate = formatDate(this.contractorForm.value.passportIssueDate);

			// Определяем, обновляем ли данные или добавляем нового контрагента
			if (this.contractorId != null) {
				this.contractorService.updateContractor(this.contractorId, contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (error) => console.error('Ошибка при обновлении контрагента', error),
				});
			} else {
				this.contractorService.addContractor(contractorData).subscribe({
					next: () => this.router.navigate(['/contractors']),
					error: (error) => console.error('Ошибка при добавлении контрагента', error),
				});
			}
		}
	}
}
