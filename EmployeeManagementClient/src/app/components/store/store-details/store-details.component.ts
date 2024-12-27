import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreService } from '../../../services/store.service';
import { Store } from '../../../models/store.model';
import { ActivatedRoute, Router } from '@angular/router';

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
		private storeService: StoreService,
		private route: ActivatedRoute,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.params.subscribe(params => {
			if (params['id']) {
				const storeId = Number(params['id']);
				this.loadStore(storeId);
			}
		});
	}

	loadStore(id: number): void {
		this.storeService.getStoreById(id).subscribe(store => {
			this.store = store;
		});
	}

	// Добавляем метод для редактирования
	editStore(): void {
		if (this.store && this.store.id) {
			this.router.navigate(['/stores/edit', this.store.id]);
		}
	}
}
