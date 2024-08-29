import { Component, OnInit } from '@angular/core';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';

@Component({
	selector: 'app-store-list',
	templateUrl: './store-list.component.html',
	styleUrls: ['./store-list.component.css']
})
export class StoreListComponent implements OnInit {
	stores: Store[] = [];

	constructor(private storeService: StoreService) { }

	ngOnInit(): void {
		this.storeService.getAllStores().subscribe(
			data => this.stores = data,
			error => console.error('Ошибка при получении списка торговых точек', error)
		);
	}
}
