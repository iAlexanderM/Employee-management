import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorPointsService } from '../../../../services/contractor-points.service';
import { Citizenship } from '../../../../models/contractor-points.model';
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
    selector: 'app-contractor-points-citizenship-details',
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
