import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Router } from '@angular/router';
import { Citizenship } from '../../../../models/contractor-points.model';

@Component({
	selector: 'app-contractor-points-citizenship-create',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './contractor-points-citizenship-create.component.html',
	styleUrl: './contractor-points-citizenship-create.component.css'
})
export class ContractorPointsCitizenshipCreateComponent {
	newCitizenshipName: string = '';
	errorMessage: string = '';

	constructor(private contractorPointsService: ContractorPointsService, private router: Router) { }

	addCitizenship(): void {
		if (this.newCitizenshipName.trim()) {
			this.contractorPointsService.addCitizenship(this.newCitizenshipName).subscribe(
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
		}
	}
}