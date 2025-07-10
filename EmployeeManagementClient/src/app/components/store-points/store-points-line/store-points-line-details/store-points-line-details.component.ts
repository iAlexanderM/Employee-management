import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Line } from '../../../../models/store-points.model';

// Angular Material Imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
	selector: 'app-store-points-line-details',
	standalone: true,
	imports: [
		CommonModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatTooltipModule
	],
	templateUrl: './store-points-line-details.component.html',
	styleUrls: ['./store-points-line-details.component.css']
})
export class StorePointsLineDetailsComponent implements OnInit {
	line: Line | null = null;

	constructor(
		private storePointsService: StorePointsService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const lineId = Number(params['id']);
				this.loadLine(lineId);
			}
		});
	}

	loadLine(id: number): void {
		this.storePointsService.getLineById(id).subscribe({
			next: (data) => {
				this.line = data;
			},
			error: (err) => {
				console.error('[loadLine] Ошибка загрузки линии:', err);
				this.line = null;
			}
		});
	}

	// Метод для перехода на страницу редактирования
	editLine(): void {
		if (this.line && this.line.id) {
			this.router.navigate(['/line/edit', this.line.id]);
		}
	}

	// Метод для возврата к списку
	goBack(): void {
		this.router.navigate(['/line']);
	}
}