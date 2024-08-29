import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-register',
	standalone: true,
	imports: [FormsModule, CommonModule],
	templateUrl: './register.component.html',
	styleUrls: ['./register.component.css']
})
export class RegisterComponent {
	username: string = '';
	password: string = '';

	constructor(private authService: AuthService, private router: Router) { }

	register(): void {
		this.authService.register(this.username, this.password).subscribe(
			(success: boolean) => {
				if (success) {
					alert('Регистрация прошла успешно!');
					this.router.navigate(['/login']);
				} else {
					alert('Ошибка при регистрации. Попробуйте еще раз.');
				}
			},
			error => console.error('Ошибка при регистрации', error)
		);
	}
}
