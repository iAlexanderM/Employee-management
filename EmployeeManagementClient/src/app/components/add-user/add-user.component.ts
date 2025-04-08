import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
	selector: 'app-add-user',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
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
		// Поля пустые по умолчанию, минимум валидации
		this.addUserForm = this.fb.group({
			username: ['', Validators.required], // Пустое, только обязательное
			password: ['', Validators.required], // Пустое, только обязательное
			role: ['Manager', Validators.required], // Роль по умолчанию Manager
			email: [null], // Опционально, null
			phoneNumber: [null] // Опционально, null
		});
	}

	register(): void {
		if (this.addUserForm.valid) {
			const userData = {
				username: this.addUserForm.value.username,
				password: this.addUserForm.value.password,
				role: this.addUserForm.value.role,
				email: this.addUserForm.value.email || null,
				phoneNumber: this.addUserForm.value.phoneNumber || null
			};
			this.http.post('/api/auth/register', userData).subscribe({
				next: (response: any) => {
					this.successMessage = 'Пользователь успешно добавлен!';
					this.errorMessage = '';
					this.serverErrors = [];
					setTimeout(() => this.router.navigate(['/dashboard']), 2000);
				},
				error: (err) => {
					this.successMessage = '';
					if (err.error && Array.isArray(err.error)) {
						this.serverErrors = err.error;
						this.errorMessage = 'Ошибка при добавлении пользователя:';
					} else {
						this.serverErrors = [];
						this.errorMessage = err.error?.message || 'Неизвестная ошибка при добавлении пользователя';
					}
				}
			});
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
			this.serverErrors = [];
			this.successMessage = '';
		}
	}
}