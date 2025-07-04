import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';

@Component({
	selector: 'app-contractor-points-citizenship-create',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatCheckboxModule,
		MatButtonModule,
		MatIconModule,
		MatGridListModule,
		MatTooltipModule,
		TextFieldModule,
	],
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

	cancel(): void {
		this.router.navigate(['/citizenship']);
	}
}
