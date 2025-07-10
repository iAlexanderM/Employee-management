import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Floor } from '../../../../models/store-points.model';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-store-points-floor-details',
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatTooltipModule
	],
	templateUrl: './store-points-floor-details.component.html',
	styleUrls: ['./store-points-floor-details.component.css']
})
export class StorePointsFloorDetailsComponent implements OnInit {
	floor: Floor | null = null;

	constructor(
		private storePointsService: StorePointsService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const floorId = Number(params['id']);
				this.loadFloor(floorId);
			}
		});
	}

	loadFloor(id: number): void {
		this.storePointsService.getFloorById(id).subscribe({
			next: (data) => {
				this.floor = data;
			},
			error: (err) => {
				console.error('[loadFloor] Ошибка загрузки этажа:', err);
				this.floor = null;
			}
		});
	}

	// Метод для перехода на страницу редактирования
	editFloor(): void {
		if (this.floor && this.floor.id) {
			this.router.navigate(['/floor/edit', this.floor.id]);
		}
	}

	// Метод для возврата к списку
	goBack(): void {
		this.router.navigate(['/floor']);
	}
}