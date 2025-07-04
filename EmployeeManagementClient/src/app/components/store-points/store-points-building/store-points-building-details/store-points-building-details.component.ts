import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Building } from '../../../../models/store-points.model';

@Component({
    selector: 'app-store-points-building-details',
    imports: [CommonModule],
    templateUrl: './store-points-building-details.component.html',
    styleUrls: ['./store-points-building-details.component.css']
})
export class StorePointsBuildingDetailsComponent implements OnInit {
	building: Building | null = null;

	constructor(
		private storePointsService: StorePointsService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const buildingId = Number(params['id']);
				this.loadBuilding(buildingId);
			}
		});
	}

	loadBuilding(id: number): void {
		this.storePointsService.getBuildingById(id).subscribe({
			next: (data) => {
				this.building = data;
			},
			error: (err) => {
				console.error('[loadBuilding] Ошибка загрузки здания:', err);
				this.building = null;
			}
		});
	}

	// Метод для перехода на страницу редактирования
	editBuilding(): void {
		if (this.building && this.building.id) {
			this.router.navigate(['/building/edit', this.building.id]);
		}
	}

	// Метод для возврата к списку
	goBack(): void {
		this.router.navigate(['/building']);
	}
}
