import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Citizenship } from '../../../../models/contractor-points.model';

@Component({
	selector: 'app-contractor-points-citizenship-details',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './contractor-points-citizenship-details.component.html',
	styleUrl: './contractor-points-citizenship-details.component.css'
})
export class ContractorPointsCitizenshipDetailsComponent implements OnInit {
	citizenship: Citizenship | null = null;

	constructor(
		private contractorPointsService: ContractorPointsService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const citizenshipId = Number(params['id']);
				this.loadCitizenship(citizenshipId);
			}
		});
	}

	loadCitizenship(id: number): void {
		this.contractorPointsService.getCitizenshipById(id).subscribe({
			next: (data) => {
				this.citizenship = data;
			},
			error: (err) => {
				console.error('[loadCitizenship] Ошибка загрузки здания:', err);
				this.citizenship = null;
			}
		});
	}

	// Метод для перехода на страницу редактирования
	editCitizenship(): void {
		if (this.citizenship && this.citizenship.id) {
			this.router.navigate(['/citizenship/edit', this.citizenship.id]);
		}
	}

	// Метод для возврата к списку
	goBack(): void {
		this.router.navigate(['/citizenship']);
	}
}
