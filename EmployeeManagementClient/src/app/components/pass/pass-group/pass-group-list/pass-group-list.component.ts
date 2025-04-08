import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';

@Component({
	selector: 'app-pass-group-list',
	templateUrl: './pass-group-list.component.html',
	styleUrls: ['./pass-group-list.component.css'],
	standalone: true,
	imports: [CommonModule, RouterModule],
})
export class PassGroupListComponent {
	passGroups: any[] = [];

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
