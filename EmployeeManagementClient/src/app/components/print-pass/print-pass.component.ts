import { Component, OnInit } from '@angular/core';
import { ContractorService } from '../../services/contractor.service';
import { Contractor } from '../../models/contractor.model';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-print-pass',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './print-pass.component.html',
	styleUrls: ['./print-pass.component.css']
})
export class PrintPassComponent implements OnInit {
	contractors: Contractor[] = [];

	constructor(private contractorService: ContractorService) { }

	ngOnInit(): void {
		this.contractorService.getContractors().subscribe(
			(data: Contractor[]) => this.contractors = data,
			error => console.error('Ошибка при загрузке списка контрагентов', error)
		);
	}

	printPass(contractor: Contractor): void {
		const printContents = `
      <div>
        <h3>Пропуск</h3>
        <p>Имя: ${contractor.firstName}</p>
        <p>Фамилия: ${contractor.lastName}</p>
        <p>Дата Рождения: ${contractor.birthDate}</p>
        <p>Тип продукции: ${contractor.productType}</p>
      </div>
    `;
		const printWindow = window.open('', '_blank');
		if (printWindow) {
			printWindow.document.write(printContents);
			printWindow.document.close();
			printWindow.print();
		}
	}
}
