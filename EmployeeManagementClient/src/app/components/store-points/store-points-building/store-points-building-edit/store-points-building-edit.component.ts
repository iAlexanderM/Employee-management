import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { Building } from '../../../../models/store-points.model';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-store-points-building-edit',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-building-edit.component.html',
	styleUrls: ['./store-points-building-edit.component.css']
})
export class StorePointsBuildingEditComponent implements OnInit {
	building: Building | null = null;
	updatedBuildingName: string = '';
	updatedSortOrder: number | null = null;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.storePointsService.getBuildingById(id).subscribe(data => {
			this.building = data;
			this.updatedBuildingName = data.name;
			this.updatedSortOrder = data.sortOrder ?? 0;
		});
	}

	updateBuilding(): void {
		if (this.building && this.updatedBuildingName.trim() && this.updatedSortOrder !== null) {
			this.storePointsService.updateBuilding(this.building.id!, this.updatedBuildingName, this.updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/building']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Здание с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении здания. Попробуйте снова.';
					}
				}
			);
		}
	}
}
