import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-store-points-building-create',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-building-create.component.html',
	styleUrls: ['./store-points-building-create.component.css']
})
export class StorePointsBuildingCreateComponent {
	newBuildingName: string = '';
	errorMessage: string = '';

	constructor(private storePointsService: StorePointsService, private router: Router) { }

	addBuilding(): void {
		if (this.newBuildingName.trim()) {
			this.storePointsService.addBuilding(this.newBuildingName).subscribe(
				() => {
					this.router.navigate(['/building']);
				},
				(error) => {
					if (error.status === 409) {
						this.errorMessage = 'Здание с таким именем уже существует. Пожалуйста, выберите другое имя.';
					} else {
						this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
					}
				}
			);
		}
	}
}
