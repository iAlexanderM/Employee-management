import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../../../services/store.service';

@Component({
	selector: 'app-store-form',
	templateUrl: './store-form.component.html',
	styleUrls: ['./store-form.component.css']
})
export class StoreFormComponent implements OnInit {
	@Input() store: any;
	@Output() formSubmit = new EventEmitter<void>();

	storeForm!: FormGroup;
	errorMessage: string = '';

	constructor(private fb: FormBuilder, private storeService: StoreService) { }

	ngOnInit(): void {
		this.storeForm = this.fb.group({
			building: [this.store?.building || '', Validators.required],
			floor: [this.store?.floor || '', Validators.required],
			line: [this.store?.line || '', Validators.required],
			number: [this.store?.number || '', Validators.required],
			contractorId: [this.store?.contractorId || null]
		});
	}

	onSubmit(): void {
		if (this.storeForm.valid) {
			if (this.store) {
				this.storeService.updateStore(this.store.id, this.storeForm.value).subscribe(
					() => {
						this.formSubmit.emit();
					},
					(error) => {
						console.error('Error updating store', error);
						this.errorMessage = 'Ошибка при обновлении торговой точки. Пожалуйста, попробуйте позже.';
					}
				);
			} else {
				this.storeService.createStore(this.storeForm.value).subscribe(
					() => {
						this.formSubmit.emit();
					},
					(error) => {
						console.error('Error creating store', error);
						this.errorMessage = 'Ошибка при создании торговой точки. Пожалуйста, попробуйте позже.';
					}
				);
			}
		}
	}
}
