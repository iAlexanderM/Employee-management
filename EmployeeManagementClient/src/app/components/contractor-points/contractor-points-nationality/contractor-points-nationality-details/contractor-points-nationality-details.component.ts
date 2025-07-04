import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Nationality } from '../../../../models/contractor-points.model';
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
	selector: 'app-contractor-points-nationality-details',
	standalone: true,
	imports: [
		CommonModule,
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
	templateUrl: './contractor-points-nationality-details.component.html',
	styleUrl: './contractor-points-nationality-details.component.css'
})
export class ContractorPointsNationalityDetailsComponent implements OnInit {
	nationality: Nationality | null = null;

	constructor(
		private contractorPointsService: ContractorPointsService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const nationalityId = Number(params['id']);
				this.loadNationality(nationalityId);
			}
		});
	}

	loadNationality(id: number): void {
		this.contractorPointsService.getNationalityById(id).subscribe({
			next: (data) => {
				this.nationality = data;
			},
			error: (err) => {
				console.error('[loadNationality] Ошибка загрузки здания:', err);
				this.nationality = null;
			}
		});
	}

	// Метод для перехода на страницу редактирования
	editNationality(): void {
		if (this.nationality && this.nationality.id) {
			this.router.navigate(['/nationality/edit', this.nationality.id]);
		}
	}

	// Метод для возврата к списку
	goBack(): void {
		this.router.navigate(['/nationality']);
	}
}
