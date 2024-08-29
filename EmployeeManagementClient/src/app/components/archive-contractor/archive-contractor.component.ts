import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContractorService } from '../../services/contractor.service';
import { Contractor } from '../../models/contractor.model';

@Component({
	selector: 'app-archive-contractor',
	templateUrl: './archive-contractor.component.html',
	styleUrls: ['./archive-contractor.component.css']
})
export class ArchiveContractorComponent implements OnInit {
	contractor: Contractor | null = null;

	constructor(
		private contractorService: ContractorService,
		private route: ActivatedRoute,
		private router: Router
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
		if (this.contractor && this.contractor.id) {
			this.contractorService.archiveContractor(this.contractor.id).subscribe(
				() => this.router.navigate(['/contractors']),
				error => console.error('Ошибка при архивации контрагента', error)
			);
		}
	}
}
