import { Component, OnInit, OnDestroy, Output, EventEmitter, Renderer2, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassGroupTypeService } from '../../../services/pass-group-type.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
	selector: 'app-pass-group-modal',
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		MatTableModule,
		MatSelectModule,
		MatIconModule,
		MatSnackBarModule
	],
	templateUrl: './pass-group-modal.component.html',
	styleUrls: ['./pass-group-modal.component.css']
})
export class PassGroupModalComponent implements OnInit, OnDestroy {
	@Output() modalClose = new EventEmitter<void>();
	@Output() groupSelected = new EventEmitter<any>();
	groups: any[] = [];
	errorMessage: string = '';

	private loadSubscription: Subscription | null = null;

	constructor(
		private service: PassGroupTypeService,
		private renderer: Renderer2,
		private el: ElementRef,
		private snackBar: MatSnackBar
	) { }

	ngOnInit(): void {
		this.renderer.appendChild(document.body, this.el.nativeElement);
		this.loadGroups();
	}

	ngOnDestroy(): void {
		if (this.loadSubscription) {
			this.loadSubscription.unsubscribe();
		}
		this.renderer.removeChild(document.body, this.el.nativeElement);
	}

	loadGroups(): void {
		this.loadSubscription = this.service.getGroups()
			.pipe(take(1))
			.subscribe({
				next: (data) => {
					this.groups = data;
				},
				error: (err) => {
					console.error('Ошибка при загрузке групп пропусков:', err);
					this.errorMessage = 'Не удалось загрузить группы пропусков.';
					this.snackBar.open('Не удалось загрузить группы пропусков.', 'Закрыть', { duration: 3000 });
				}
			});
	}

	selectGroup(group: any): void {
		this.groupSelected.emit(group);
		this.closeModal();
	}

	closeModal(): void {
		this.modalClose.emit();
	}

	stopPropagation(event: Event): void {
		event.stopPropagation();
	}
}