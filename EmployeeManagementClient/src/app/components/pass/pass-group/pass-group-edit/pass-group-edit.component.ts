import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';

@Component({
	selector: 'app-pass-group-edit',
	templateUrl: './pass-group-edit.component.html',
	styleUrls: ['./pass-group-edit.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule],
})
export class PassGroupEditComponent implements OnInit {
	group = { id: 0, name: '', color: '#ffffff' };
	constructor(
		private service: PassGroupTypeService,
		private route: ActivatedRoute,
		private router: Router // Добавлено для перенаправления
	) { }

	ngOnInit(): void {
		const id = +this.route.snapshot.params['id'];
		this.service.getGroupById(id).subscribe({
			next: (group) => {
				this.group = {
					...group,
					color: group.color || '#ffffff', // Проверка значения цвета
				};
			},
			error: (err) => console.error('Ошибка при загрузке группы:', err),
		});
	}

	updateGroup(): void {
		this.service.updateGroup(this.group).subscribe({
			next: () => {
				console.log('Группа обновлена');
				this.router.navigate(['/pass-groups']); // Перенаправление на список групп
			},
			error: (err) => console.error('Ошибка при обновлении группы:', err),
		});
	}
}
