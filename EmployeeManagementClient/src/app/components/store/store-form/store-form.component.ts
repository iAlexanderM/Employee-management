import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '../../../models/store.model';

@Component({
	selector: 'app-store-form',
	templateUrl: './store-form.component.html',
	styleUrls: ['./store-form.component.css']
})
export class StoreFormComponent implements OnInit {
	storeForm: FormGroup;
	isEditMode: boolean = false;
	storeId: string | null = null;

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private route: ActivatedRoute,
		private router: Router
	) {
		this.storeForm = this.fb.group({
			building: ['', Validators.required],
			floor: ['', Validators.required],
			line: ['', Validators.required],
			storeNumber: ['', Validators.required],
			assignedContractorId: ['']
		});
	}

	ngOnInit(): void {
		this.storeId = this.route.snapshot.paramMap.get('id');
		if (this.storeId) {
			this.isEditMode = true;
			this.storeService.getStoreById(this.storeId).subscribe(
				(store: Store) => this.storeForm.patchValue(store),
				error => console.error('Ошибка при загрузке данных торговой точки', error)
			);
		}
	}

	onSubmit(): void {
		if (this.storeForm.valid) {
			if (this.isEditMode) {
				this.storeService.updateStore(this.storeId!, this.storeForm.value).subscribe(
					() => this.router.navigate(['/stores']),
					error => console.error('Ошибка при обновлении данных торговой точки', error)
				);
			} else {
				this.storeService.createStore(this.storeForm.value).subscribe(
					() => this.router.navigate(['/stores']),
					error => console.error('Ошибка при создании торговой точки', error)
				);
			}
		}
	}
}
