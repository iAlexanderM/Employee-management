import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PassGroupTypeService } from '../../../../services/pass-group-type.service';

@Component({
	selector: 'app-pass-group-details',
	templateUrl: './pass-group-details.component.html',
	styleUrls: ['./pass-group-details.component.css'],
	standalone: true
})
export class PassGroupDetailsComponent implements OnInit {
	group: any = null;

	constructor(
		private service: PassGroupTypeService,
		private route: ActivatedRoute
	) { }

	ngOnInit(): void {
		const id = this.route.snapshot.params['id'];
		this.loadGroup(id);
	}

	loadGroup(id: number): void {
		this.service.getGroupById(id).subscribe({
			next: (group) => (this.group = group),
			error: (err) => console.error('Ошибка при загрузке группы:', err),
		});
	}
}
