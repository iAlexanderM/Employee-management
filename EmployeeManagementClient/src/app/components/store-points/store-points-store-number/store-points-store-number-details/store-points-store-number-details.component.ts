import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { StoreNumber } from '../../../../models/store-points.model';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-store-points-store-number-details',
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatTooltipModule
	],
	templateUrl: './store-points-store-number-details.component.html',
	styleUrls: ['./store-points-store-number-details.component.css']
})
export class StorePointsStoreNumberDetailsComponent implements OnInit {
	storeNumber: StoreNumber | null = null;

	constructor(
		private storePointsService: StorePointsService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const storeNumberId = Number(params['id']);
				this.loadStoreNumber(storeNumberId);
			}
		});
	}

	loadStoreNumber(id: number): void {
		this.storePointsService.getStoreNumberById(id).subscribe({
			next: (data) => {
				this.storeNumber = data;
			},
			error: (err) => {
				console.error('[loadStoreNumber] Ошибка загрузки здания:', err);
				this.storeNumber = null;
			}
		});
	}

	// Метод для перехода на страницу редактирования
	editStoreNumber(): void {
		if (this.storeNumber && this.storeNumber.id) {
			this.router.navigate(['/storeNumber/edit', this.storeNumber.id]);
		}
	}

	// Метод для возврата к списку
	goBack(): void {
		this.router.navigate(['/storeNumber']);
	}
}