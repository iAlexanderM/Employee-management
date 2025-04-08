import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PassService } from '../../../services/pass.service';
import { PassPrintQueueItem } from '../../../models/pass-print-queue.model';
import { TransactionService } from '../../../services/transaction.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
	selector: 'app-pass-print-queue',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, RouterModule],
	templateUrl: './pass-print-queue.component.html',
	styleUrls: ['./pass-print-queue.component.css']
})
export class PassPrintQueueComponent implements OnInit {
	passes: PassPrintQueueItem[] = [];
	currentPage = 1;
	pageSize = 25;
	totalItems = 0;
	totalPages = 0;
	visiblePages: (number | string)[] = [];
	pageSizeOptions = [25, 50, 100];
	searchForm: FormGroup;
	userMap: { [key: string]: string } = {};

	private readonly cacheKey = 'printQueueSearchState'; // Ключ для localStorage

	constructor(
		private passService: PassService,
		private transactionService: TransactionService,
		private fb: FormBuilder,
		private router: Router,
		private route: ActivatedRoute
	) {
		this.searchForm = this.fb.group({
			contractorId: [null]
		});
	}

	ngOnInit(): void {
		this.loadUsersFromTransactions();
		this.restoreSearchState();
		this.loadPrintQueue();
	}

	loadUsersFromTransactions(): void {
		this.transactionService.searchTransactions({}, 1, 100).subscribe({
			next: (result) => {
				result.transactions.forEach(t => {
					if (t.user) {
						this.userMap[t.userId] = t.user.userName || 'Unknown';
					}
				});
			},
			error: (err) => console.error('Ошибка загрузки пользователей:', err)
		});
	}

	loadPrintQueue(): void {
		const contractorId = this.searchForm.value.contractorId;
		this.passService.getPrintQueue(this.currentPage, this.pageSize, contractorId).subscribe({
			next: (result) => {
				this.passes = result.items;
				this.totalItems = result.total;
				this.totalPages = Math.ceil(this.totalItems / this.pageSize);
				this.updateVisiblePages();
				this.saveSearchState(); // Сохраняем состояние после загрузки
			},
			error: (error) => console.error('Ошибка при загрузке очереди на печать:', error)
		});
	}

	updateVisiblePages(): void {
		const pages: (number | string)[] = [];
		const maxVisible = 7;

		if (this.totalPages <= maxVisible) {
			for (let i = 1; i <= this.totalPages; i++) pages.push(i);
		} else {
			if (this.currentPage <= 4) {
				for (let i = 1; i <= 6; i++) pages.push(i);
				pages.push('...');
				pages.push(this.totalPages);
			} else if (this.currentPage >= this.totalPages - 3) {
				pages.push(1);
				pages.push('...');
				for (let i = this.totalPages - 5; i <= this.totalPages; i++) pages.push(i);
			} else {
				pages.push(1);
				pages.push('...');
				pages.push(this.currentPage - 1);
				pages.push(this.currentPage);
				pages.push(this.currentPage + 1);
				pages.push('...');
				pages.push(this.totalPages);
			}
		}
		this.visiblePages = pages;
	}

	onPageClick(page: number | string): void {
		if (page === '...') return;
		const pageNumber = page as number;
		if (pageNumber < 1 || pageNumber > this.totalPages) return;
		this.currentPage = pageNumber;
		this.loadPrintQueue();
	}

	onPageSizeChange(event: Event): void {
		const target = event.target as HTMLSelectElement;
		this.pageSize = +target.value;
		this.currentPage = 1;
		this.loadPrintQueue();
	}

	onSearch(): void {
		this.currentPage = 1;
		this.loadPrintQueue();
	}

	onReset(): void {
		this.searchForm.reset({ contractorId: null });
		this.currentPage = 1;
		this.pageSize = 25;
		this.clearSearchState(); // Очищаем кэш при сбросе
		this.loadPrintQueue();
	}

	printTransaction(transactionId: number): void {
		this.router.navigate(['/passes/print', transactionId], {
			queryParams: { from: 'print-queue' }
		});
	}

	private saveSearchState(): void {
		const state = {
			contractorId: this.searchForm.value.contractorId,
			page: this.currentPage,
			pageSize: this.pageSize
		};
		localStorage.setItem(this.cacheKey, JSON.stringify(state));
	}

	private restoreSearchState(): void {
		const cachedState = localStorage.getItem(this.cacheKey);
		if (cachedState) {
			const state = JSON.parse(cachedState);
			this.searchForm.patchValue({ contractorId: state.contractorId });
			this.currentPage = state.page || 1;
			this.pageSize = state.pageSize || 25;
		}
	}

	private clearSearchState(): void {
		localStorage.removeItem(this.cacheKey);
	}
}