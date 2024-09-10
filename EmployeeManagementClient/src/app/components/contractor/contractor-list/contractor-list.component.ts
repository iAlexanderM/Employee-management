import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContractorService } from '../../../services/contractor.service';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-contractor-list',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './contractor-list.component.html',
	styleUrls: ['./contractor-list.component.css']
})
export class ContractorListComponent implements OnInit {
	contractors: Contractor[] = [];

	constructor(private contractorService: ContractorService) { }

	ngOnInit(): void {
		this.contractorService.getContractors().subscribe({
			next: (data: Contractor[]) => this.contractors = data,
			error: (error) => console.error('Ошибка при загрузке списка контрагентов', error)
		});
	}
}
