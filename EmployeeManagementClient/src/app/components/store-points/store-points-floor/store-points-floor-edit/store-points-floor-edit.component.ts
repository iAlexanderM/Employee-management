import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Floor } from '../../../../models/store-points.model';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-store-points-floor-edit',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-floor-edit.component.html',
	styleUrls: ['./store-points-floor-edit.component.css']
})
export class StorePointsFloorEditComponent implements OnInit {
	floor: Floor | null = null;
	updatedFloorName: string = '';
	updatedSortOrder: number | null = null;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.storePointsService.getFloorById(id).subscribe(data => {
			this.floor = data;
			this.updatedFloorName = data.name;
			this.updatedSortOrder = data.sortOrder ?? 0;
		});
	}

	updateFloor(): void {
		if (this.floor && this.updatedFloorName.trim() && this.updatedSortOrder !== null) {
			this.storePointsService.updateFloor(this.floor.id!, this.updatedFloorName, this.updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/floor']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Этаж с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении этажа. Попробуйте снова.';
					}
				}
			);
		}
	}
}
