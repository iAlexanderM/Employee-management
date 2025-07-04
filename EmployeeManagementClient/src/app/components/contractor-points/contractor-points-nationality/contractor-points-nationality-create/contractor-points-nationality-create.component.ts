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
    selector: 'app-contractor-points-nationality-create',
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
    templateUrl: './contractor-points-nationality-create.component.html',
    styleUrls: ['./contractor-points-nationality-create.component.css']
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

	cancel(): void {
		this.router.navigate(['/nationality']);
	}
}
