import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Nationality } from '../../../../models/contractor-points.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-contractor-points-nationality-edit',
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
    ],
    templateUrl: './contractor-points-nationality-edit.component.html',
    styleUrls: ['./contractor-points-nationality-edit.component.css'] // Исправлено на styleUrls
})
export class ContractorPointsNationalityEditComponent implements OnInit {
	nationality: Nationality | null = null;
	nationalityForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private contractorPointsService: ContractorPointsService,
		private fb: FormBuilder
	) {
		this.nationalityForm = this.fb.group({
			nationalityName: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]]
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.contractorPointsService.getNationalityById(id).subscribe(data => {
			this.nationality = data;
			this.nationalityForm.patchValue({
				nationalityName: data.name,
				sortOrder: data.sortOrder ?? 0
			});
		});
	}

	updateNationality(): void {
		if (this.nationalityForm.valid && this.nationality) {
			const updatedName = this.nationalityForm.value.nationalityName.trim();
			const updatedSortOrder = this.nationalityForm.value.sortOrder;

			this.contractorPointsService.updateNationality(this.nationality.id!, updatedName, updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/nationality']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Национальность с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении национальности. Попробуйте снова.';
					}
				}
			);
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
		}
	}

	cancel(): void {
		this.router.navigate(['/nationality']);
	}
}
