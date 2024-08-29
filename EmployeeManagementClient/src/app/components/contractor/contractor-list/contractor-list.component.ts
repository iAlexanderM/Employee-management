// src/app/components/contractor/contractor-list/contractor-list.component.ts

import { Component, OnInit } from '@angular/core';
import { ContractorService } from '../../../services/contractor.service';

@Component({
	selector: 'app-contractor-list',
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit {
	contractors: any[] = [];
	errorMessage: string = '';

	constructor(private contractorService: ContractorService) { }

	ngOnInit(): void {
		this.contractorService.getContractors().subscribe(
			(data) => {
				this.contractors = data;
			},
			(error) => {
				console.error('Error fetching contractors', error);
				this.errorMessage = 'Не удалось загрузить список контрагентов. Пожалуйста, попробуйте позже.';
			}
		);
	}
}
