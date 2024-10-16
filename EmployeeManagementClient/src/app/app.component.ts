import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	isReferencesExpanded = false;
	title = 'Employee Management';

	constructor(private authService: AuthService, private router: Router) { }

	isAuthenticated(): boolean {
		return this.authService.isAuthenticated();
	}

	toggleReferences() {
		this.isReferencesExpanded = !this.isReferencesExpanded;
	}

	logout(): void {
		this.authService.logout().subscribe(() => {
			console.log('Successfully logged out');
			this.router.navigate(['/login']);
		}, error => {
			console.error('Ошибка при выходе из системы:', error);
		});
	}
}
