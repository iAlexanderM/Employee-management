import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [FormsModule, CommonModule],
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent {
	username: string = '';
	password: string = '';

	constructor(private authService: AuthService, private router: Router) { }

	login(): void {
		this.authService.login(this.username, this.password).subscribe(
			(success: boolean) => {
				if (success) {
					this.router.navigate(['/contractors']); //после успешного логина поменять на поиск торговой точке
				} else {
					alert('Ошибка входа. Проверьте логин и пароль.');
				}
			},
			error => console.error('Ошибка при входе', error)
		);
	}
}
