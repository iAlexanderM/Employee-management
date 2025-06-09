// login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		CommonModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatCardModule,
		MatIconModule
	],
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent {
	loginForm: FormGroup;
	errorMessage: string = '';
	hidePassword = true;

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router
	) {
		this.loginForm = this.fb.group({
			username: ['', [Validators.required, Validators.minLength(3)]],
			password: ['', [Validators.required, Validators.minLength(6)]]
		});
	}

	login(): void {
		if (this.loginForm.valid) {
			const { username, password } = this.loginForm.value;
			this.authService.login(username.trim(), password).subscribe({
				next: (success: boolean) => {
					if (success) {
						this.router.navigate(['/contractors']);
					} else {
						this.errorMessage = 'Ошибка входа. Проверьте логин и пароль.';
					}
				},
				error: (error) => {
					console.error('Ошибка при входе', error);
					this.errorMessage = 'Произошла ошибка при входе. Попробуйте позже.';
				}
			});
		} else {
			this.markAllFieldsAsTouched();
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля корректно.';
		}
	}

	private markAllFieldsAsTouched(): void {
		Object.keys(this.loginForm.controls).forEach(key => {
			this.loginForm.get(key)?.markAsTouched();
		});
	}

	getErrorMessage(fieldName: string): string {
		const field = this.loginForm.get(fieldName);
		if (field?.hasError('required')) {
			return `${fieldName === 'username' ? 'Логин' : 'Пароль'} обязателен`;
		}
		if (field?.hasError('minlength')) {
			const requiredLength = field.errors?.['minlength'].requiredLength;
			return `Минимум ${requiredLength} символов`;
		}
		return '';
	}
}