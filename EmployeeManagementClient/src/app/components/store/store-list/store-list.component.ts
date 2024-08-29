import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-store-list',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './store-list.component.html',
	styleUrls: ['./store-list.component.css']
})
export class StoreListComponent implements OnInit {
	stores: Store[] = [];

	constructor(private storeService: StoreService) { }

	ngOnInit(): void {
		this.storeService.getStores().subscribe(
			(data: Store[]) => this.stores = data,
			error => console.error('Ошибка при загрузке списка торговых точек', error)
		);
	}
}
