import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Citizenship } from '../../../../models/contractor-points.model';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-contractor-points-citizenship-edit',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './contractor-points-citizenship-edit.component.html',
	styleUrl: './contractor-points-citizenship-edit.component.css'
})
export class ContractorPointsCitizenshipEditComponent implements OnInit {
	citizenship: Citizenship | null = null;
	updatedCitizenshipName: string = '';
	updatedSortOrder: number | null = null;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private contractorPointsService: ContractorPointsService
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.contractorPointsService.getCitizenshipById(id).subscribe(data => {
			this.citizenship = data;
			this.updatedCitizenshipName = data.name;
			this.updatedSortOrder = data.sortOrder ?? 0;
		});
	}

	updateCitizenship(): void {
		if (this.citizenship && this.updatedCitizenshipName.trim() && this.updatedSortOrder !== null) {
			this.contractorPointsService.updateCitizenship(this.citizenship.id!, this.updatedCitizenshipName, this.updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/citizenship']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Гражданство с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении здания. Попробуйте снова.';
					}
				}
			);
		}
	}
}
