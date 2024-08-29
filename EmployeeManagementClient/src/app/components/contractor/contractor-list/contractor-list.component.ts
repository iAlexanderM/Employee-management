import { Component, OnInit } from '@angular/core';
import { ContractorService } from '../../../services/contractor.service';
import { Contractor } from '../../../models/contractor.model';

@Component({
	selector: 'app-contractor-list',
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit {
	contractors: Contractor[] = [];

	constructor(private contractorService: ContractorService) { }

	ngOnInit(): void {
		this.contractorService.getAllContractors().subscribe(
			data => this.contractors = data,
			error => console.error('Ошибка при получении списка контрагентов', error)
		);
	}
}
