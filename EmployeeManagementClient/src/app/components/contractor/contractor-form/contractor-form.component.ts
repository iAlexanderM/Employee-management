import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContractorService } from '../../../services/contractor.service';
import { Router } from '@angular/router';
import { NgxDropzoneModule } from 'ngx-dropzone';

@Component({
	selector: 'app-contractor-form',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, NgxDropzoneModule],
	templateUrl: './contractor-form.component.html',
	styleUrls: ['./contractor-form.component.css']
})
export class ContractorFormComponent {
	contractorForm: FormGroup;
	photoFiles: File[] = []; // Для хранения фотографий
	documentFiles: File[] = []; // Для хранения документов

	constructor(private fb: FormBuilder, private contractorService: ContractorService, private router: Router) {
		this.contractorForm = this.fb.group({
			firstName: ['', Validators.required],
			lastName: ['', Validators.required],
			middleName: ['', Validators.required],
			birthDate: ['', Validators.required],
			documentType: ['', Validators.required],
			passportSerialNumber: ['', Validators.required],
			passportIssuedBy: ['', Validators.required],
			passportIssueDate: ['', Validators.required],
			productType: ['', Validators.required],
			isArchived: [false, Validators.required],
			photos: [null],
			documentPhotos: [null],
		});
	}

	// Метод для обработки выбора фотографий
	onPhotoSelect(event: any): void {
		const files: File[] = event.addedFiles; // Получаем файлы из события
		this.photoFiles.push(...files); // Добавляем файлы в массив
	}

	// Метод для удаления выбранной фотографии
	onPhotoRemove(file: File): void {
		this.photoFiles = this.photoFiles.filter(f => f !== file); // Удаляем файл из массива
	}

	// Метод для обработки выбора документов
	onDocumentSelect(event: any): void {
		const files: File[] = event.addedFiles; // Получаем файлы из события
		this.documentFiles.push(...files); // Добавляем файлы в массив документов
	}

	// Метод для удаления выбранного документа
	onDocumentRemove(file: File): void {
		this.documentFiles = this.documentFiles.filter(f => f !== file); // Удаляем файл из массива
	}

	onSubmit(): void {
		const contractorData = this.contractorForm.value;

		// Преобразование дат в формат UTC
		contractorData.birthDate = new Date(contractorData.birthDate).toISOString();
		contractorData.passportIssueDate = new Date(contractorData.passportIssueDate).toISOString();

		// Используем сервис для отправки данных
		this.contractorService.addContractor({
			...contractorData,
			photos: this.photoFiles,
			documentPhotos: this.documentFiles
		}).subscribe({
			next: (response) => {
				console.log('Success!', response);
				this.router.navigate(['/contractors']);
			},
			error: (err) => {
				console.error('Error:', err);
			},
		});
	}
}
