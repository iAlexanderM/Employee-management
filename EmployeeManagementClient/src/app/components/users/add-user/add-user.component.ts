import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSelectModule } from '@angular/material/select';

@Component({
	selector: 'app-add-user',
	standalone: true,
	imports: [
		CommonModule,
		ReactiveFormsModule,
		MatCardModule,
		MatFormFieldModule,
		MatInputModule,
		MatIconModule,
		MatButtonModule,
		MatGridListModule,
		MatSelectModule
	],
	templateUrl: './add-user.component.html',
	styleUrls: ['./add-user.component.css']
})
export class AddUserComponent {
	addUserForm: FormGroup;
	errorMessage: string = '';
	successMessage: string = '';
	serverErrors: { code: string; description: string }[] = [];

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router,
		private http: HttpClient
	) {
		this.addUserForm = this.fb.group({
			username: ['', Validators.required],
			password: ['', Validators.required],
			role: ['Manager', Validators.required],
			email: [null],
			phoneNumber: [null],
			firstName: ['', Validators.required],
			lastName: ['', Validators.required],
			middleName: [null],
		});
	}

	register(): void {
		this.errorMessage = '';
		this.successMessage = '';
		this.serverErrors = [];

		if (this.addUserForm.valid) {
			const userData = {
				username: this.addUserForm.value.username,
				password: this.addUserForm.value.password,
				role: this.addUserForm.value.role,
				email: this.addUserForm.value.email || null,
				phoneNumber: this.addUserForm.value.phoneNumber || null,
				firstName: this.addUserForm.value.firstName || null,
				lastName: this.addUserForm.value.lastName || null,
				middleName: this.addUserForm.value.middleName || null
			};

			this.http.post('/api/auth/register', userData).subscribe({
				next: (response: any) => {
					this.successMessage = 'Пользователь успешно добавлен!';
					setTimeout(() => this.router.navigate(['/dashboard']), 2000);
				},
				error: (err) => {
					if (err.error && Array.isArray(err.error)) {
						this.serverErrors = err.error;
						this.errorMessage = 'Ошибка при добавлении пользователя:';
					} else {
						this.errorMessage = err.error?.message || 'Неизвестная ошибка при добавлении пользователя';
					}
					console.error('Error adding user:', err);
				}
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
			this.addUserForm.markAllAsTouched();
		}
	}
}