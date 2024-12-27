import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';

@Component({
	selector: 'app-pass-group-create',
	templateUrl: './pass-group-create.component.html',
	styleUrls: ['./pass-group-create.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
})
export class PassGroupCreateComponent {
	group = { id: 0, name: '', color: '' };

	constructor(private service: PassGroupTypeService, private router: Router) { }

	createGroup(): void {
		this.service.createGroup(this.group).subscribe({
			next: () => {
				console.log('Группа создана');
				this.router.navigate(['/pass-groups']); // Перенаправляем на список групп
			},
			error: (err) => console.error('Ошибка при создании группы:', err),
		});
	}
}
