import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Citizenship } from '../../../../models/contractor-points.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
	selector: 'app-contractor-points-citizenship-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './contractor-points-citizenship-edit.component.html',
	styleUrls: ['./contractor-points-citizenship-edit.component.css']
})
export class ContractorPointsCitizenshipEditComponent implements OnInit {
	citizenship: Citizenship | null = null;
	citizenshipForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private contractorPointsService: ContractorPointsService,
		private fb: FormBuilder
	) {
		this.citizenshipForm = this.fb.group({
			citizenshipName: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]]
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.contractorPointsService.getCitizenshipById(id).subscribe(data => {
			this.citizenship = data;
			this.citizenshipForm.patchValue({
				citizenshipName: data.name,
				sortOrder: data.sortOrder ?? 0
			});
		});
	}

	updateCitizenship(): void {
		if (this.citizenshipForm.valid && this.citizenship) {
			const updatedName = this.citizenshipForm.value.citizenshipName.trim();
			const updatedSortOrder = this.citizenshipForm.value.sortOrder;

			this.contractorPointsService.updateCitizenship(this.citizenship.id!, updatedName, updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/citizenship']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Гражданство с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении гражданства. Попробуйте снова.';
					}
				}
			);
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
		}
	}
}
