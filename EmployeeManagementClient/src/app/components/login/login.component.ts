import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent {
	username: string = '';
	password: string = '';
	errorMessage: string = '';

	constructor(private authService: AuthService, private router: Router) { }

	login(): void {
		this.authService.login(this.username, this.password).subscribe(
			(response: any) => {
				this.authService.setToken(response.token);
				this.router.navigate(['/']);
			},
			(error: any) => {
				console.error('Login failed', error);
				this.errorMessage = 'Ошибка входа. Пожалуйста, проверьте свои учетные данные.';
			}
		);
	}
}
