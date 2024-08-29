// src/app/components/contractor/contractor-details/contractor-details.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorService } from '../../../services/contractor.service';

@Component({
	selector: 'app-contractor-details',
	templateUrl: './contractor-details.component.html',
	styleUrls: ['./contractor-details.component.css']
})
export class ContractorDetailsComponent implements OnInit {
	contractor: any;
	contractorId: number | null = null;

	constructor(
		private route: ActivatedRoute,
		private contractorService: ContractorService,
		private router: Router
	) { }

	ngOnInit(): void {
		this.route.paramMap.subscribe(params => {
			this.contractorId = Number(params.get('id'));
			if (this.contractorId) {
				this.loadContractor(this.contractorId);
			}
		});
	}

	loadContractor(id: number): void {
		this.contractorService.getContractorById(id).subscribe({
			next: (contractor) => this.contractor = contractor,
			error: (err) => console.error('Ошибка при загрузке контрагента', err)
		});
	}

	archiveContractor(): void {
		if (this.contractorId !== null) {
			this.contractorService.archiveContractor(this.contractorId).subscribe({
				next: () => this.router.navigate(['/contractors']),
				error: (err) => console.error('Ошибка при архивации контрагента', err)
			});
		}
	}
}
