import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorePointsService } from '../../../../services/store-points.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-store-points-line-create',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-line-create.component.html',
	styleUrls: ['./store-points-line-create.component.css']
})
export class StorePointsLineCreateComponent {
	newLineName: string = '';
	errorMessage: string = '';

	constructor(private storePointsService: StorePointsService, private router: Router) { }

	addLine(): void {
		if (this.newLineName.trim()) {
			this.storePointsService.addLine(this.newLineName).subscribe(
				() => {
					this.router.navigate(['/line']);
				},
				(error) => {
					if (error.status === 409) {
						this.errorMessage = 'Линия с таким именем уже существует. Пожалуйста, выберите другое имя.';
					} else {
						this.errorMessage = 'Произошла ошибка. Пожалуйста, попробуйте еще раз.';
					}
				}
			);
		}
	}
}
