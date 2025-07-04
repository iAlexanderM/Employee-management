import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PositionService } from '../../../services/position.service';
import { Position } from '../../../models/position.model';

@Component({
    selector: 'app-position-details',
    imports: [CommonModule],
    templateUrl: './position-details.component.html',
    styleUrl: './position-details.component.css'
})
export class PositionDetailsComponent implements OnInit {
	position: Position | null = null;

	constructor(
		private positionService: PositionService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const positionId = Number(params['id']);
				this.loadPosition(positionId);
			}
		});
	}

	loadPosition(id: number): void {
		this.positionService.getPositionById(id).subscribe({
			next: (data) => {
				this.position = data;
			},
			error: (err) => {
				console.error('[loadPosition] Ошибка загрузки здания:', err);
				this.position = null;
			}
		});
	}

	// Метод для перехода на страницу редактирования
	editPosition(): void {
		if (this.position && this.position.id) {
			this.router.navigate(['/position/edit', this.position.id]);
		}
	}

	// Метод для возврата к списку
	goBack(): void {
		this.router.navigate(['/positions']);
	}
}
