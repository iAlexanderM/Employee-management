import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContractorService } from '../../../services/contractor.service';
import { Contractor } from '../../../models/contractor.model';

@Component({
	selector: 'app-contractor-details',
	templateUrl: './contractor-details.component.html',
	styleUrls: ['./contractor-details.component.css']
})
export class ContractorDetailsComponent implements OnInit {
	contractor: Contractor | null = null;

	constructor(
		private route: ActivatedRoute,
		private contractorService: ContractorService
	) { }

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id');
		if (id) {
			this.contractorService.getContractorById(id).subscribe(
				(data: Contractor) => this.contractor = data,
				error => console.error('Ошибка при загрузке данных контрагента', error)
			);
		}
	}
}
