import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Nationality } from '../../../../models/contractor-points.model';

@Component({
	selector: 'app-contractor-points-nationality-details',
	standalone: true,
	imports: [CommonModule],
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
