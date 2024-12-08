import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Router } from '@angular/router';
import { Nationality } from '../../../../models/contractor-points.model';

@Component({
	selector: 'app-contractor-points-nationality-create',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './contractor-points-nationality-create.component.html',
	styleUrl: './contractor-points-nationality-create.component.css'
})
export class ContractorPointsNationalityCreateComponent {
	newNationalityName: string = '';
	errorMessage: string = '';

	constructor(private contractorPointsService: ContractorPointsService, private router: Router) { }

	addNationality(): void {
		if (this.newNationalityName.trim()) {
			this.contractorPointsService.addNationality(this.newNationalityName).subscribe(
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
		}
	}
}