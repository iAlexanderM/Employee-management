import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StorePointsService } from '../../../../services/store-points.service';
import { StoreNumber } from '../../../../models/store-points.model';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-store-points-store-number-edit',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './store-points-store-number-edit.component.html',
	styleUrls: ['./store-points-store-number-edit.component.css']
})
export class StorePointsStoreNumberEditComponent implements OnInit {
	storeNumber: StoreNumber | null = null;
	updatedStoreNumberName: string = '';
	updatedSortOrder: number | null = null;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storePointsService: StorePointsService
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.storePointsService.getStoreNumberById(id).subscribe(data => {
			this.storeNumber = data;
			this.updatedStoreNumberName = data.name;
			this.updatedSortOrder = data.sortOrder ?? 0;
		});
	}

	updateStoreNumber(): void {
		if (this.storeNumber && this.updatedStoreNumberName.trim() && this.updatedSortOrder !== null) {
			this.storePointsService.updateStoreNumber(this.storeNumber.id!, this.updatedStoreNumberName, this.updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/storeNumber']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Торговая точка с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении здания. Попробуйте снова.';
					}
				}
			);
		}
	}
}
