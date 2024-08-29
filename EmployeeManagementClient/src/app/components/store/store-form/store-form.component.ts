import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { StoreService } from '../../../services/store.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '../../../models/store.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-store-form',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule, RouterModule],
	templateUrl: './store-form.component.html',
	styleUrls: ['./store-form.component.css']
})
export class StoreFormComponent implements OnInit {
	storeForm: FormGroup;
	storeId: string | null = null;

	constructor(
		private fb: FormBuilder,
		private storeService: StoreService,
		private router: Router,
		private route: ActivatedRoute
	) {
		this.storeForm = this.fb.group({
			building: ['', Validators.required],
			floor: ['', Validators.required],
			line: ['', Validators.required],
			number: ['', Validators.required],
			contractorId: ['']
		});
	}

	ngOnInit(): void {
		this.storeId = this.route.snapshot.paramMap.get('id');
		if (this.storeId) {
			this.storeService.getStoreById(this.storeId).subscribe(
				(data: Store) => this.storeForm.patchValue(data),
				error => console.error('Ошибка при загрузке данных торговой точки', error)
			);
		}
	}

	onSubmit(): void {
		if (this.storeForm.valid) {
			const storeData = this.storeForm.value;

			if (this.storeId) {
				this.storeService.updateStore(this.storeId, storeData).subscribe(
					() => this.router.navigate(['/stores']),
					error => console.error('Ошибка при обновлении торговой точки', error)
				);
			} else {
				this.storeService.addStore(storeData).subscribe(
					() => this.router.navigate(['/stores']),
					error => console.error('Ошибка при добавлении торговой точки', error)
				);
			}
		}
	}
}
