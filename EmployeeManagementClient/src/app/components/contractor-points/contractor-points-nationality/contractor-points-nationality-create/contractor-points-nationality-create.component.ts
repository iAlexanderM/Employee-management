import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-contractor-points-nationality-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './contractor-points-nationality-create.component.html',
	styleUrls: ['./contractor-points-nationality-create.component.css'] // Исправлено на styleUrls
})
export class ContractorPointsNationalityCreateComponent {
	nationalityForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private contractorPointsService: ContractorPointsService,
		private router: Router
	) {
		this.nationalityForm = this.fb.group({
			nationalityName: ['', Validators.required]
		});
	}

	addNationality(): void {
		if (this.nationalityForm.valid) {
			const nationalityName = this.nationalityForm.value.nationalityName.trim();
			this.contractorPointsService.addNationality(nationalityName).subscribe(
				() => {
					this.router.navigate(['/nationality']);
				},
				(error) => {
					if (error.status === 409) {
						this.errorMessage = 'Национальность с таким именем уже существует. Пожалуйста, выберите другое имя.';
					} else {
						this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
					}
				}
			);
		} else {
			this.errorMessage = 'Пожалуйста, заполните обязательные поля.';
		}
	}
}
