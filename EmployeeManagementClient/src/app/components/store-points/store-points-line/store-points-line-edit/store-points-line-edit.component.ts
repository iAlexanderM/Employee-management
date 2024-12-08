import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Line } from '../../../../models/store-points.model';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-store-points-line-edit',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-line-edit.component.html',
	styleUrls: ['./store-points-line-edit.component.css']
})
export class StorePointsLineEditComponent implements OnInit {
	line: Line | null = null;
	updatedLineName: string = '';
	updatedSortOrder: number | null = null;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.storePointsService.getLineById(id).subscribe(data => {
			this.line = data;
			this.updatedLineName = data.name;
			this.updatedSortOrder = data.sortOrder ?? 0;
		});
	}

	updateLine(): void {
		if (this.line && this.updatedLineName.trim() && this.updatedSortOrder !== null) {
			this.storePointsService.updateLine(this.line.id!, this.updatedLineName, this.updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/line']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Линия с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении этажа. Попробуйте снова.';
					}
				}
			);
		}
	}
}
