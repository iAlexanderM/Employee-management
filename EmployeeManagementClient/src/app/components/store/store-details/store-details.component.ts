import { Component, Input, OnInit } from '@angular/core';
import { StoreService } from '../../../services/store.service';

@Component({
	selector: 'app-store-details',
	templateUrl: './store-details.component.html',
	styleUrls: ['./store-details.component.css']
})
export class StoreDetailsComponent implements OnInit {
	@Input() storeId!: number;
	store: any;
	errorMessage: string = '';

	constructor(private storeService: StoreService) { }

	ngOnInit(): void {
		this.fetchStoreDetails();
	}

	fetchStoreDetails(): void {
		this.storeService.getStoreById(this.storeId).subscribe(
			(data) => {
				this.store = data;
			},
			(error) => {
				console.error('Error fetching store details', error);
				this.errorMessage = 'Не удалось загрузить данные торговой точки. Пожалуйста, попробуйте позже.';
			}
		);
	}
}
