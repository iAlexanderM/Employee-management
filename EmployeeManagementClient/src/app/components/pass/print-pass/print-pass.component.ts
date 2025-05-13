import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PassService } from '../../../services/pass.service';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Pass } from '../../../models/pass.model';
import { Contractor } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';

@Component({
	selector: 'app-print-pass',
	standalone: true,
	imports: [CommonModule, HttpClientModule],
	templateUrl: './print-pass.component.html',
	styleUrls: ['./print-pass.component.css']
})
export class PrintPassComponent implements OnInit {
	passes: Pass[] = [];
	printContents: SafeHtml[] = [];
	isPendingPrint = false;
	private readonly apiBaseUrl = 'http://localhost:8080';

	constructor(
		private route: ActivatedRoute,
		private passService: PassService,
		private contractorService: ContractorWatchService,
		private router: Router,
		private sanitizer: DomSanitizer
	) { }

	ngOnInit(): void {
		const transactionId = +this.route.snapshot.paramMap.get('id')!;
		this.isPendingPrint = this.route.snapshot.queryParams['from'] === 'print-queue';

		const fetchMethod = this.isPendingPrint
			? this.passService.getPendingPassesByTransactionId(transactionId)
			: this.passService.getPassesByTransactionId(transactionId);

		fetchMethod.subscribe({
			next: (data: Pass[]) => {
				this.passes = data;
				console.log('Загруженные пропуска:', this.passes); // Отладка
				this.loadContractorData();
			},
			error: (error: any) => {
				console.error('Ошибка при загрузке пропусков:', error);
				this.router.navigate(this.isPendingPrint ? ['/passes/print-queue'] : ['/passes/issued']);
			}
		});
	}

	async loadContractorData(): Promise<void> {
		const contractorIds = [...new Set(this.passes.map(p => p.contractorId))];
		try {
			const contractors = await Promise.all(
				contractorIds.map(id =>
					firstValueFrom(this.contractorService.getContractor(id.toString())) // Changed from getContractorById to getContractor
				)
			);
			const contractorMap = new Map<number, Contractor>();
			contractors.forEach(c => {
				if (c && 'id' in c) { // Check if c is a valid Contractor with an id
					contractorMap.set(c.id, c as Contractor);
				}
			});
			console.log('Загруженные контрагенты:', contractorMap); // Отладка
			this.preparePrintContents(contractorMap);
		} catch (error) {
			console.error('Ошибка при загрузке данных контрагентов:', error);
			this.preparePrintContents(new Map());
		}
	}

	getFirstPhoto(contractor: Contractor | null): string {
		if (contractor?.photos?.length) {
			const mainPhoto = contractor.photos.find(photo => !photo.isDocumentPhoto) || contractor.photos[0];
			if (mainPhoto?.filePath) {
				const photoUrl = `${this.apiBaseUrl}/${mainPhoto.filePath.replace(/\\/g, '/').replace(/^.*wwwroot\//, '')}`;
				console.log('URL фото:', photoUrl); // Отладка
				return photoUrl;
			}
		}
		console.warn('Фото не найдено, используется заглушка:', contractor); // Отладка
		return '/assets/images/default-photo.jpg';
	}

	formatStoreFullName(store: any): string {
		if (store && typeof store === 'object') {
			return '[+PLACE_ZDANIE+] [+PLACE_ETAJH+] [+PLACE_LINIA+] [+PLACE_TOCHKA+]'
				.replace('[+PLACE_ZDANIE+]', store.building || 'N/A')
				.replace('[+PLACE_ETAJH+]', store.floor || '')
				.replace('[+PLACE_LINIA+]', store.line || '')
				.replace('[+PLACE_TOCHKA+]', store.storeNumber || 'N/A')
				.replace('[+PLACE_ZONA+]', '');
		}
		return 'Торговая точка неизвестно';
	}

	preparePrintContents(contractorMap: Map<number, Contractor>): void {
		this.printContents = this.passes.map(pass => {
			const contractor = contractorMap.get(pass.contractorId) || null;
			if (!pass.passType?.printTemplate) {
				console.error('Шаблон пропуска отсутствует:', pass);
				return this.sanitizer.bypassSecurityTrustHtml('<p>Ошибка: шаблон не найден</p>');
			}

			const startDate = pass.startDate ? new Date(pass.startDate) : null;
			const endDate = pass.endDate ? new Date(pass.endDate) : null;
			const passNumber = `${pass.storeId}-${pass.contractorId}`;
			const firstPhoto = this.getFirstPhoto(contractor);
			const storeFullName = pass.storeFullName || this.formatStoreFullName(pass.store) || `Торговая точка ${pass.storeId}`;

			const rawContents = pass.passType.printTemplate
				.replace('[+PASSNUMBER+]', passNumber)
				.replace('[+PHOTO+]', firstPhoto)
				.replace('[+RESIZED_IMAGE+]', firstPhoto)
				.replace('[+F+]', contractor?.lastName || 'N/A')
				.replace('[+I+]', contractor?.firstName || 'N/A')
				.replace('[+O+]', contractor?.middleName || '')
				.replace('[+RABOTODATEL_FIO+]', '')
				.replace('[+POSITION+]', pass.position || 'N/A')
				.replace('[+DOPUSK_PRINT+]', '')
				.replace('[+DATEWORK_START+]', startDate ? startDate.toLocaleDateString('ru-RU') : 'N/A')
				.replace('[+DATEWORK_FINISH+]', endDate ? endDate.toLocaleDateString('ru-RU') : 'N/A')
				.replace('[+PLACE_ZDANIE+]', pass.store?.building || 'N/A')
				.replace('[+PLACE_ETAJH+]', pass.store?.floor || '')
				.replace('[+PLACE_LINIA+]', pass.store?.line || '')
				.replace('[+PLACE_TOCHKA+]', pass.store?.storeNumber || 'N/A')
				.replace('[+PLACE_ZONA+]', '')
				.replace('[+COLOR+]', pass.passType.color || '#000000')
				.replace('[+Z_COLOR_EX+]', '')
				.replace('[+Z_COLOR_EX_STYLE+]', '');

			console.log('Сгенерированный HTML для пропуска:', rawContents); // Отладка
			return this.sanitizer.bypassSecurityTrustHtml(rawContents);
		});
	}

	printPass(index: number): void {
		const printWindow = window.open('', '_blank', 'fullscreen=yes');
		if (printWindow) {
			const content = this.printContents[index];
			printWindow.document.write(`
                <html>
                  <head>
                    <title>Печать пропуска #${this.passes[index].uniquePassId}</title>
                    <style>
                      @page { margin: 0; }
                      body { margin: 0; padding: 0; }
                      img { max-width: 100%; height: auto; display: block; }
                      /* Включаем фоновые изображения */
                      @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                      }
                    </style>
                  </head>
                  <body onload="window.print()">
                    <div style="margin: 40px 0;">
                      ${(content as any).changingThisBreaksApplicationSecurity || content}
                    </div>
                  </body>
                </html>
            `);
			printWindow.document.close();

			// Обработка после печати
			printWindow.onafterprint = () => {
				if (this.isPendingPrint && this.passes[index].status !== 'Issued') {
					const passId = this.passes[index].id;
					this.passService.issuePass(passId).subscribe({
						next: () => {
							console.log(`Пропуск ${this.passes[index].uniquePassId} выдан.`);
							this.passes[index].status = 'Issued';
							printWindow.close();
							this.checkAllIssued();
						},
						error: (error: any) => {
							console.error('Ошибка при выдаче пропуска:', error);
							printWindow.close();
						}
					});
				} else {
					printWindow.close();
				}
			};
		} else {
			console.error('Не удалось открыть окно печати.');
		}
	}

	checkAllIssued(): void {
		const allIssued = this.passes.every(pass => pass.status === 'Issued');
		if (allIssued) {
			console.log('Все пропуска в транзакции выданы, перенаправляем обратно.');
			const contractorId = this.route.snapshot.queryParams['contractorId'];
			this.router.navigate(this.isPendingPrint ? ['/passes/print-queue'] : ['/passes/issued'], {
				queryParams: { contractorId: contractorId || undefined }
			});
		}
	}

	goBack(): void {
		const contractorId = this.route.snapshot.queryParams['contractorId'];
		this.router.navigate(this.isPendingPrint ? ['/passes/print-queue'] : ['/passes/issued'], {
			queryParams: { contractorId: contractorId || undefined }
		});
	}

	isIssued(index: number): boolean {
		return this.passes[index].status === 'Issued';
	}
}