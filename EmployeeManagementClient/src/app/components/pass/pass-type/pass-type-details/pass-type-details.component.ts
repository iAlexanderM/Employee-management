import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { PassType } from '../../../../models/pass-type.model';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
	selector: 'app-pass-type-details',
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		MatCardModule,
		MatButtonModule,
		MatIconModule,
		MatTooltipModule,
	],
	templateUrl: './pass-type-details.component.html',
	styleUrls: ['./pass-type-details.component.css']
})
export class PassTypeDetailsComponent implements OnInit {
	passType: PassType | null = null;
	passGroupName: string = '';
	errorMessage: string = '';
	printContent: SafeHtml | null = null;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private service: PassGroupTypeService,
		private sanitizer: DomSanitizer
	) { }

	ngOnInit(): void {
		const id = Number(this.route.snapshot.params['id']);
		if (!id) {
			console.error('Некорректный ID типа пропуска');
			this.errorMessage = 'Некорректный ID типа пропуска.';
			return;
		}

		this.service.getTypeById(id).subscribe({
			next: (data) => {
				this.passType = data;
				this.preparePrintContent();
				this.loadGroupName(data.passGroupId);
			},
			error: (err) => {
				console.error('Ошибка при загрузке типа пропуска:', err);
				this.errorMessage = 'Ошибка при загрузке типа пропуска.';
			},
		});
	}

	loadGroupName(passGroupId: number): void {
		if (passGroupId) {
			this.service.getGroupById(passGroupId).subscribe({
				next: (group) => (this.passGroupName = group.name),
				error: (err) => console.error('Ошибка при загрузке названия группы:', err),
			});
		}
	}

	preparePrintContent(): void {
		if (this.passType?.printTemplate) {
			this.printContent = this.sanitizer.bypassSecurityTrustHtml(this.passType.printTemplate);
		} else {
			console.warn('Шаблон для печати отсутствует');
			this.printContent = this.sanitizer.bypassSecurityTrustHtml('<p>Шаблон не найден</p>');
		}
	}

	printPassType(): void {
		if (!this.passType?.printTemplate) {
			console.error('Шаблон для печати отсутствует');
			this.errorMessage = 'Шаблон для печати отсутствует.';
			return;
		}

		const printWindow = window.open('', '_blank', 'fullscreen=yes');
		if (printWindow) {
			printWindow.document.write(`
        <html>
          <head>
            <title>Print Pass Type #${this.passType.id}</title>
            <style>
              @page { margin: 0; }
              body { margin: 0; padding: 0; }
              img { max-width: 100%; height: auto; display: block; }
              @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body onload="window.print()">
            <div style="margin: 40px 0;">
              ${this.passType.printTemplate}
            </div>
          </body>
        </html>
      `);
			printWindow.document.close();
			printWindow.onafterprint = () => printWindow.close();
		} else {
			console.error('Не удалось открыть окно печати.');
			this.errorMessage = 'Не удалось открыть окно печати.';
		}
	}

	goBack(): void {
		this.router.navigate(['/pass-types'], {
			queryParams: {
				groupId: this.passType?.passGroupId,
				groupName: this.passGroupName,
			},
		});
	}
}