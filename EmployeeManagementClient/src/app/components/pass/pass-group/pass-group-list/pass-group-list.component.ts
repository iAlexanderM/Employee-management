import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
	selector: 'app-pass-group-list',
	templateUrl: './pass-group-list.component.html',
	styleUrls: ['./pass-group-list.component.css'],
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		MatGridListModule,
		MatTableModule,
		MatSelectModule,
		MatIconModule,
		MatTooltipModule,
		MatProgressSpinnerModule,
		MatSnackBarModule,
	]
})
export class PassGroupListComponent {
	passGroups: any[] = [];
	isSearchMode = false;
	isExpanded = false;
	currentPage: number = 1;
	pageSizeOptions: number[] = [25, 50, 100];
	pageSize: number = 25;
	totalItems: number = 0;
	totalPages: number = 0;
	visiblePages: (number | string)[] = [];

	constructor(private service: PassGroupTypeService, private router: Router) { }

	ngOnInit(): void {
		this.loadPassGroups();
	}

	loadPassGroups(): void {
		this.service.getGroups().subscribe({
			next: (response) => {
				this.passGroups = Array.isArray(response) ? response : [];
			},
			error: (err) => console.error('Ошибка при загрузке групп пропусков:', err),
		});
	}

	openPassTypes(groupId: number, groupName: string): void {
		this.router.navigate(['/pass-types'], { queryParams: { groupId, groupName } });
	}

	deleteGroup(id: number): void {
		if (confirm('Вы уверены, что хотите удалить эту группу?')) {
			this.service.deleteGroup(id).subscribe({
				next: () => this.loadPassGroups(),
				error: (err) => console.error('Ошибка при удалении группы:', err),
			});
		}
	}
}
