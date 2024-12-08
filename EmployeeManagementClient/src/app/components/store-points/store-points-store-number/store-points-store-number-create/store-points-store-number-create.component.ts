import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-store-points-store-number-create',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-store-number-create.component.html',
	styleUrls: ['./store-points-store-number-create.component.css']
})
export class StorePointsStoreNumberCreateComponent {
	newStoreNumberName: string = '';
	errorMessage: string = '';

	constructor(private storePointsService: StorePointsService, private router: Router) { }

	addStoreNumber(): void {
		if (this.newStoreNumberName.trim()) {
			this.storePointsService.addStoreNumber(this.newStoreNumberName).subscribe(
				() => {
					this.router.navigate(['/storeNumber']);
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
