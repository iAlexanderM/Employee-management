// src/app/components/pass/pass-create/pass-create.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { PassService } from '../../../services/pass.service';
import { Pass } from '../../../models/pass.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-pass-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './pass-create.component.html',
	styleUrls: ['./pass-create.component.css']
})
export class PassCreateComponent implements OnInit {
	passForm: FormGroup;

	constructor(
		private fb: FormBuilder,
		private passService: PassService
	) {
		this.passForm = this.fb.group({
			uniquePassId: ['', Validators.required],
			contractorId: ['', Validators.required],
			storeId: ['', Validators.required],
			passTypeId: ['', Validators.required],
			startDate: ['', Validators.required],
			endDate: ['', Validators.required],
			position: ['']
		});
	}

	ngOnInit(): void {
	}

	onSubmit(): void {
		if (this.passForm.invalid) {
			return;
		}

		const pass: Pass = this.passForm.value;

		this.passService.createPass(pass).subscribe(
			(response) => {
				alert('Пропуск успешно создан.');
				this.passForm.reset();
			},
			(error) => {
				console.error('Ошибка при создании пропуска:', error);
				alert('Не удалось создать пропуск.');
			}
		);
	}
}
