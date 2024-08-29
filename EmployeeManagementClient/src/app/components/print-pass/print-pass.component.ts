import { Component } from '@angular/core';
import { ContractorService } from '../../services/contractor.service';
import { Contractor } from '../../models/contractor.model';

@Component({
	selector: 'app-print-pass',
	templateUrl: './print-pass.component.html',
	styleUrls: ['./print-pass.component.css']
})
export class PrintPassComponent {
	contractors: Contractor[] = [];

	constructor(private contractorService: ContractorService) { }

	ngOnInit(): void {
		this.contractorService.getAllContractors().subscribe(
			data => this.contractors = data,
			error => console.error('Ошибка при получении списка контрагентов', error)
		);
	}

	printPass(contractor: Contractor): void {
		const printContent = `
      <div>
        <h1>Пропуск</h1>
        <p><strong>ФИО:</strong> ${contractor.lastName} ${contractor.firstName} ${contractor.middleName || ''}</p>
        <p><strong>Дата рождения:</strong> ${new Date(contractor.dateOfBirth).toLocaleDateString()}</p>
        <p><strong>Тип документа:</strong> ${contractor.documentType}</p>
        <p><strong>Серия и номер паспорта:</strong> ${contractor.passportSeries} ${contractor.passportNumber}</p>
      </div>
    `;

		const newWindow = window.open('', '_blank', 'width=600,height=400');
		if (newWindow) {
			newWindow.document.write(printContent);
			newWindow.document.close();
			newWindow.print();
		}
	}
}
