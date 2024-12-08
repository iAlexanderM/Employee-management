import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Nationality } from '../../../../models/contractor-points.model';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-contractor-points-nationality-edit',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './contractor-points-nationality-edit.component.html',
	styleUrl: './contractor-points-nationality-edit.component.css'
})
export class ContractorPointsNationalityEditComponent implements OnInit {
	nationality: Nationality | null = null;
	updatedNationalityName: string = '';
	updatedSortOrder: number | null = null;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private contractorPointsService: ContractorPointsService
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.contractorPointsService.getNationalityById(id).subscribe(data => {
			this.nationality = data;
			this.updatedNationalityName = data.name;
			this.updatedSortOrder = data.sortOrder ?? 0;
		});
	}

	updateNationality(): void {
		if (this.nationality && this.updatedNationalityName.trim() && this.updatedSortOrder !== null) {
			this.contractorPointsService.updateNationality(this.nationality.id!, this.updatedNationalityName, this.updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/nationality']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Национальность с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении здания. Попробуйте снова.';
					}
				}
			);
		}
	}
}