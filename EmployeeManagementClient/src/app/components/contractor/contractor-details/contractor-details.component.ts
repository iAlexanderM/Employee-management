import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorService } from '../../../services/contractor.service';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-contractor-details',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './contractor-details.component.html',
	styleUrls: ['./contractor-details.component.css']
})
export class ContractorDetailsComponent implements OnInit {
	contractor: Contractor | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
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

	archiveContractor(): void {
		if (this.contractor?.id) {
			this.contractorService.archiveContractor(this.contractor.id).subscribe(
				() => {
					alert('Контрагент успешно архивирован');
					this.router.navigate(['/contractors']);
				},
				error => console.error('Ошибка при архивировании контрагента', error)
			);
		}
	}
}