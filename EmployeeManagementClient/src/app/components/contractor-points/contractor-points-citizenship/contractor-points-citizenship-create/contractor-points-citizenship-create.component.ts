import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-contractor-points-citizenship-create',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './contractor-points-citizenship-create.component.html',
	styleUrls: ['./contractor-points-citizenship-create.component.css']
})
export class ContractorPointsCitizenshipCreateComponent {
	citizenshipForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private contractorPointsService: ContractorPointsService,
		private router: Router
	) {
		this.citizenshipForm = this.fb.group({
			citizenshipName: ['', Validators.required]
		});
	}

	addCitizenship(): void {
		if (this.citizenshipForm.valid) {
			const citizenshipName = this.citizenshipForm.value.citizenshipName.trim();
			this.contractorPointsService.addCitizenship(citizenshipName).subscribe(
				() => {
					this.router.navigate(['/citizenship']);
				},
				(error) => {
					if (error.status === 409) {
						this.errorMessage = 'Гражданство с таким именем уже существует. Пожалуйста, выберите другое имя.';
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
