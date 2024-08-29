import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-store-details',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './store-details.component.html',
	styleUrls: ['./store-details.component.css']
})
export class StoreDetailsComponent implements OnInit {
	store: Store | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private storeService: StoreService
	) { }

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id');
		if (id) {
			this.storeService.getStoreById(id).subscribe(
				(data: Store) => this.store = data,
				error => console.error('Ошибка при загрузке данных торговой точки', error)
			);
		}
	}
}
