import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassService } from '../../../services/pass.service';
import { Pass } from '../../../models/pass.model';

@Component({
	selector: 'app-pass-print-queue',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './pass-print-queue.component.html',
	styleUrls: ['./pass-print-queue.component.css']
})
export class PassPrintQueueComponent implements OnInit {
	passes: Pass[] = [];

	constructor(private passService: PassService) { }

	ngOnInit(): void {
		this.loadNotPrintedPasses();
	}

	/**
	 * Загрузка пропусков, которые еще не были напечатаны.
	 */
	loadNotPrintedPasses(): void {
		this.passService.getPasses(false).subscribe(data => {
			this.passes = data;
		}, error => {
			console.error('Ошибка при загрузке пропусков для печати', error);
		});
	}

	/**
	 * Печать пропуска.
	 * @param id ID пропуска.
	 */
	printPass(id: number): void {
		this.passService.printPass(id).subscribe(() => {
			this.loadNotPrintedPasses();
			alert('Пропуск успешно отправлен на печать.');
		}, error => {
			console.error('Ошибка при печати пропуска', error);
			alert('Ошибка при печати пропуска.');
		});
	}
}
