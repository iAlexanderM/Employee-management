import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [ReactiveFormsModule, CommonModule],
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent {
	loginForm: FormGroup;
	errorMessage: string = '';

	constructor(
		private fb: FormBuilder,
		private authService: AuthService,
		private router: Router
	) {
		// Инициализация формы с контролами и валидаторами
		this.loginForm = this.fb.group({
			username: ['', Validators.required],
			password: ['', Validators.required]
		});
	}

	login(): void {
		if (this.loginForm.valid) {
			const { username, password } = this.loginForm.value;
			this.authService.login(username.trim(), password).subscribe(
				(success: boolean) => {
					if (success) {
						this.router.navigate(['/contractors']); // После успешного логина поменять на поиск торговой точки
					} else {
						this.errorMessage = 'Ошибка входа. Проверьте логин и пароль.';
					}
				},
				error => {
					console.error('Ошибка при входе', error);
					this.errorMessage = 'Произошла ошибка при входе. Попробуйте позже.';
				}
			);
		} else {
			this.errorMessage = 'Пожалуйста, заполните все обязательные поля.';
		}
	}
}
