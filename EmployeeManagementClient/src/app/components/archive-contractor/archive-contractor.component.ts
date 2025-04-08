import { Component, OnInit } from '@angular/core';
import { ContractorService } from '../../services/contractor.service';
import { Contractor } from '../../models/contractor.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-archive-contractor',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './archive-contractor.component.html',
	styleUrls: ['./archive-contractor.component.css']
})
export class ArchiveContractorComponent implements OnInit {
	contractors: Contractor[] = [];

	constructor(private contractorService: ContractorService) { }

	ngOnInit(): void {
		this.contractorService.getContractors().subscribe(
			(data: Contractor[]) => this.contractors = data,
			error => console.error('Ошибка при загрузке списка контрагентов', error)
		);
	}

	archiveContractor(id: string): void {
		this.contractorService.archiveContractor(id).subscribe(
			() => {
				this.contractors = this.contractors.map(contractor =>
					contractor.id === id ? { ...contractor, isArchived: true } : contractor
				);
				alert('Контрагент успешно архивирован');
			},
			error => console.error('Ошибка при архивировании контрагента', error)
		);
	}
}
