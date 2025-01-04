// src/app/components/queue/active-token/active-token.component.ts
import { Component, OnInit } from '@angular/core';
import { QueueService } from '../../../services/queue.service';
import { QueueToken } from '../../../models/queue.model';

@Component({
	selector: 'app-active-token',
	templateUrl: './active-token.component.html',
	styleUrls: ['./active-token.component.css']
})
export class ActiveTokenComponent implements OnInit {
	activeToken: QueueToken | null = null;

	constructor(private queueService: QueueService) { }

	ngOnInit(): void {
		this.loadActiveToken();
	}

	loadActiveToken(): void {
		this.queueService.listAllTransactions().subscribe(
			(transactions) => {
				this.activeToken = transactions.find(t => t.status === 'Active') || null;
			},
			(error) => {
				console.error('Ошибка при загрузке активного талона:', error);
			}
		);
	}
}
