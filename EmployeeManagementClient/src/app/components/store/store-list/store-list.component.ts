import { Component, OnInit } from '@angular/core';
import { StoreService } from '../../../services/store.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
	selector: 'app-store-list',
	templateUrl: './store-list.component.html',
	styleUrls: ['./store-list.component.css']
})
export class StoreListComponent implements OnInit {
	stores: any[] = [];
	errorMessage: string = '';

	constructor(private storeService: StoreService) { }

	ngOnInit(): void {
		this.loadStores();
	}

	loadStores(): void {
		this.storeService.getStores().subscribe(
			(data) => {
				this.stores = data;
			},
			(error: HttpErrorResponse) => {  // Указан тип error
				console.error('Error fetching stores', error);
				this.errorMessage = 'Не удалось загрузить торговые точки. Пожалуйста, попробуйте позже.';
			}
		);
	}

	archiveStore(storeId: number): void {
		this.storeService.archiveStore(storeId).subscribe(
			() => {
				this.loadStores();
			},
			(error: HttpErrorResponse) => {  // Указан тип error
				console.error('Error archiving store', error);
				this.errorMessage = 'Не удалось архивировать торговую точку. Пожалуйста, попробуйте позже.';
			}
		);
	}
}
