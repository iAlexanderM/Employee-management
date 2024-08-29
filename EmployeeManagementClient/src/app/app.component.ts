import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';  // Убираем лишний импорт RouterModule

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'Employee Management';

	constructor(private authService: AuthService, private router: Router) { }

	isAuthenticated(): boolean {
		return this.authService.isAuthenticated();
	}

	logout(): void {
		this.authService.logout();
		this.router.navigate(['/login']);
	}
}
