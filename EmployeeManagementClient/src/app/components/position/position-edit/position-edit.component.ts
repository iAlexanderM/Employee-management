import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PositionService } from '../../../services/position.service';
import { Position } from '../../../models/position.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
	selector: 'app-position-edit',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './position-edit.component.html',
	styleUrls: ['./position-edit.component.css']
})
export class PositionEditComponent implements OnInit {
	position: Position | null = null;
	positionForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private positionService: PositionService,
		private fb: FormBuilder
	) {
		this.positionForm = this.fb.group({
			positionName: ['', Validators.required],
			sortOrder: [0, [Validators.required, Validators.min(0)]]
		});
	}

	ngOnInit(): void {
		const id = Number(this.route.snapshot.paramMap.get('id'));
		this.positionService.getPositionById(id).subscribe(data => {
			this.position = data;
			this.positionForm.patchValue({
				positionName: data.name,
				sortOrder: data.sortOrder ?? 0
			});
		});
	}

	updatePosition(): void {
		if (this.positionForm.valid && this.position) {
			const updatedName = this.positionForm.value.positionName.trim();
			const updatedSortOrder = this.positionForm.value.sortOrder;

			this.positionService.updatePosition(this.position.id!, updatedName, updatedSortOrder).subscribe(
				() => {
					this.router.navigate(['/positions']);
				},
				(error) => {
					console.log('Full error object:', error);
					console.log('Error status:', error?.status);

					if (error?.status === 409) {
						this.errorMessage = 'Должность с таким именем или сортировкой уже существует. Пожалуйста, выберите другие значения.';
					} else {
						this.errorMessage = 'Произошла ошибка при обновлении гражданства. Попробуйте снова.';
					}
				}
			);
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
		}
	}
}
