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

	constructor(private authService: AuthService, private router: Router) { }

	login(): void {
		this.authService.login({ username: this.username, password: this.password }).subscribe(
			response => {
				localStorage.setItem('token', response.token);
				this.router.navigate(['/']);
			},
			error => {
				console.error('Ошибка входа', error);
			}
		);
	}
}
