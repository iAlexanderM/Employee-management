import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PassService } from '../../../services/pass.service';
import { ContractorWatchService } from '../../../services/contractor-watch.service';
import { Pass } from '../../../models/pass.model';
import { Contractor, ContractorDto } from '../../../models/contractor.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-print-pass',
    imports: [
        CommonModule,
        HttpClientModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
    ],
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
				console.debug('Loaded passes:', this.passes);
				this.loadContractorData();
			},
			error: (error: any) => {
				console.error('Error loading passes:', error.message || error);
				this.router.navigate(this.isPendingPrint ? ['/passes/print-queue'] : ['/passes/issued']);
			},
		});
	}

	private normalizeContractor(data: ContractorDto): Contractor {
		const activePasses = data.activePasses || [];
		const closedPasses = data.closedPasses || [];
		const passes = data.passes || [];
		const photos = Array.isArray(data.photos) ? data.photos : [];
		const documentPhotos = Array.isArray(data.documentPhotos) ? data.documentPhotos : [];

		return {
			id: data.id,
			firstName: data.firstName || '',
			lastName: data.lastName || '',
			middleName: data.middleName || '',
			birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
			documentType: data.documentType || '',
			passportSerialNumber: data.passportSerialNumber || '',
			passportIssuedBy: data.passportIssuedBy || '',
			citizenship: data.citizenship || '',
			nationality: data.nationality || '',
			passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate) : undefined,
			productType: data.productType || '',
			phoneNumber: data.phoneNumber || '',
			createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
			sortOrder: data.sortOrder || 0,
			photos,
			documentPhotos,
			isArchived: data.isArchived || false,
			passes,
			activePasses,
			closedPasses,
			note: data.note,
		};
	}

	async loadContractorData(): Promise<void> {
		const contractorIds = [...new Set(this.passes.map((p) => p.contractorId))];
		try {
			const contractors = await Promise.all(
				contractorIds.map((id) =>
					firstValueFrom(this.contractorService.getContractor(id.toString()))
				)
			);
			const contractorMap = new Map<number, Contractor>();
			contractors.forEach((c) => {
				if (c && 'id' in c) {
					contractorMap.set(c.id, this.normalizeContractor(c));
				}
			});
			console.debug('Loaded contractors:', contractorMap);
			this.preparePrintContent(contractorMap);
		} catch (error) {
			console.error('Error loading contractor data:', error);
			this.preparePrintContent(new Map());
		}
	}

	getFirstPhoto(contractor: Contractor | null): string {
		if (contractor?.photos?.length) {
			const mainPhoto = contractor.photos.find((photo) => !photo.isDocumentPhoto) || contractor.photos[0];
			if (mainPhoto?.filePath) {
				const photoUrl = `${this.apiBaseUrl}/${mainPhoto.filePath
					.replace(/\\/g, '/')
					.replace(/^.*wwwroot\//, '')}`;
				console.debug('Photo URL:', photoUrl);
				return photoUrl;
			}
		}
		console.warn('No photo found, using placeholder:', contractor);
		return '/assets/images/default-photo.jpg';
	}

	formatStoreFullName(store: any): string {
		if (store && typeof store === 'object') {
			return '[+PLACE_ZDANIE+] [+PLACE_ETAJH+] [+PLACE_LINIA+] [+PLACE_TOCHKA+]'
				.replace('[+PLACE_ZDANIE+]', store.building || 'N/A')
				.replace('[+PLACE_ETAJH+]', store.floor || '')
				.replace('[+PLACE_LINIA+]', store.line || '')
				.replace('[+PLACE_TOCHKA+]', store.storeNumber || 'N/A')
				.replace('[+PLACEHOLDER+]', '');
		}
		return 'Unknown store';
	}

	preparePrintContent(contractorMap: Map<number, Contractor>): void {
		this.printContents = this.passes.map((pass) => {
			const contractor = contractorMap.get(pass.contractorId) || null;
			if (!pass.passType?.printTemplate) {
				console.error('Pass template missing:', pass);
				return this.sanitizer.bypassSecurityTrustHtml('<p>Error: Template not found</p>');
			}

			const startDate = pass.startDate ? new Date(pass.startDate) : null;
			const endDate = pass.endDate ? new Date(pass.endDate) : null;
			const passNumber = `${pass.storeId}-${pass.contractorId}`;
			const firstPhoto = this.getFirstPhoto(contractor);
			const storeFullName =
				pass.storeFullName || this.formatStoreFullName(pass.store) || `Store ${pass.storeId}`;

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

			console.debug('Generated HTML for pass:', rawContents);
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
            <title>Print Pass #${this.passes[index].uniquePassId}</title>
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
              ${(content as any).changingThisBreaksApplicationSecurity || content}
            </div>
          </body>
        </html>
      `);
			printWindow.document.close();

			printWindow.onafterprint = () => {
				if (this.isPendingPrint && this.passes[index].status !== 'Issued') {
					const passId = this.passes[index].id;
					this.passService.issuePass(passId).subscribe({
						next: () => {
							console.log(`Pass ${this.passes[index].uniquePassId} issued.`);
							this.passes[index].status = 'Issued';
							printWindow.close();
							this.checkAllIssued();
						},
						error: (error: any) => {
							console.error('Error issuing pass:', error);
							printWindow.close();
						},
					});
				} else {
					printWindow.close();
				}
			};
		} else {
			console.error('Failed to open print window.');
		}
	}

	checkAllIssued(): void {
		const allIssued = this.passes.every((pass) => pass.status === 'Issued');
		if (allIssued) {
			console.log('All passes in transaction issued, redirecting.');
			const contractorId = this.route.snapshot.queryParams['contractorId'];
			this.router.navigate(this.isPendingPrint ? ['/passes/print-queue'] : ['/passes/issued'], {
				queryParams: { contractorId: contractorId || undefined },
			});
		}
	}

	goBack(): void {
		const contractorId = this.route.snapshot.queryParams['contractorId'];
		this.router.navigate(this.isPendingPrint ? ['/passes/print-queue'] : ['/passes/issued'], {
			queryParams: { contractorId: contractorId || undefined },
		});
	}

	isIssued(index: number): boolean {
		return this.passes[index].status === 'Issued';
	}
}