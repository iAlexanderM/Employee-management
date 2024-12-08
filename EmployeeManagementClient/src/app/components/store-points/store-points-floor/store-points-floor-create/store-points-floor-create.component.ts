import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-store-points-floor-create',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-floor-create.component.html',
	styleUrls: ['./store-points-floor-create.component.css']
})
export class StorePointsFloorCreateComponent {
	newFloorName: string = '';
	errorMessage: string = '';

	constructor(private storePointsService: StorePointsService, private router: Router) { }

	addFloor(): void {
		if (this.newFloorName.trim()) {
			this.storePointsService.addFloor(this.newFloorName).subscribe(
				() => {
					this.router.navigate(['/floor']);
				},
				(error) => {
					if (error.status === 409) {
						this.errorMessage = 'Этаж с таким именем уже существует. Пожалуйста, выберите другое имя.';
					} else {
						this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
					}
				}
			);
		}
	}
}
