import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassService } from '../../../services/pass.service';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { StoreService } from '../../../services/store.service';
import { PassGroupTypeService } from '../../../services/pass-group-type.service';
import { Router } from '@angular/router';
import { Contractor } from '../../../models/contractor.model';
import { Store } from '../../../models/store.model';
import { PassType } from '../../../models/pass-type.model';

@Component({
	selector: 'app-pass-create',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './pass-create.component.html',
	styleUrls: ['./pass-create.component.css']
})
export class PassCreateComponent implements OnInit {
	contractors: Contractor[] = [];
	stores: Store[] = [];
	passTypes: PassType[] = [];

	contractorId!: number;
	storeId!: number;
	passTypeId!: number;
	startDate!: string;
	endDate!: string;
	position!: string;

	constructor(
		private passService: PassService,
		private contractorService: ContractorWatchService,
		private storeService: StoreService,
		private passGroupTypeService: PassGroupTypeService,
		private router: Router
	) { }

	ngOnInit(): void {
		this.contractorService.getContractors().subscribe(
			data => this.contractors = data,
			error => console.error('Ошибка при загрузке контрагентов', error)
		);
		this.storeService.getStores().subscribe(
			data => this.stores = data,
			error => console.error('Ошибка при загрузке торговых точек', error)
		);
		this.passGroupTypeService.getPassTypes().subscribe(
			data => this.passTypes = data,
			error => console.error('Ошибка при загрузке типов пропусков', error)
		);
	}

	/**
	 * Создать новый пропуск.
	 */
	createPass(): void {
		const passData = {
			contractorId: this.contractorId,
			storeId: this.storeId,
			passTypeId: this.passTypeId,
			startDate: this.startDate,
			endDate: this.endDate,
			position: this.position
		};

		this.passService.createPass(passData).subscribe(() => {
			this.router.navigate(['/passes']);
		}, error => {
			console.error('Ошибка при создании пропуска', error);
		});
	}
}
