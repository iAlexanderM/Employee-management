import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { ApplicationUser } from '../../../models/application-user.model';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

interface UserWithRowNumber extends ApplicationUser {
	rowNumber: number;
}

@Component({
	selector: 'app-user-list',
	standalone: true,
	imports: [
		CommonModule,
		MatTableModule,
		MatCardModule,
		MatProgressSpinnerModule,
		MatIconModule,
		RouterModule
	],
	templateUrl: './user-list.component.html',
	styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
	users$: Observable<UserWithRowNumber[]> = of([]);
	displayedColumns: string[] = ['rowNumber', 'username', 'fullName'];
	isLoading: boolean = false;

	constructor(private userService: UserService) { }

	ngOnInit(): void {
		this.loadUsers();
	}

	loadUsers(): void {
		this.isLoading = true;
		this.userService.getAllUsers().pipe(
			map(users => users.map((user, index) => ({ ...user, rowNumber: index + 1 }))),
			catchError(err => {
				console.error('Ошибка при загрузке пользователей:', err);
				this.isLoading = false;
				return of([]);
			})
		).subscribe(mappedUsers => {
			this.users$ = of(mappedUsers);
			this.isLoading = false;
		});
	}

	getFullName(user: ApplicationUser): string {
		const parts = [user.lastName, user.firstName, user.middleName].filter(Boolean);
		if (parts.length > 0) {
			return parts.join(' ');
		}
		return user.userName || 'N/A';
	}
}