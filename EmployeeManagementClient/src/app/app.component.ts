import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, RouterModule],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnDestroy {
	isReferencesExpanded = false;
	isTransactionsExpanded = false;
	title = 'Employee Management';
	private inactivityListeners: (() => void)[] = [];

	constructor(private authService: AuthService, private router: Router) {
		this.setupInactivityListeners();

		this.authService.initializeToken().subscribe(isAuthenticated => {
			if (!isAuthenticated) {
				console.warn('Пользователь не авторизован. Перенаправление на /login.');
				this.router.navigate(['/login']);
			} else {
				console.log('Пользователь авторизован.');
			}
		});
	}

	/**
	 * Проверка аутентификации пользователя.
	 */
	isAuthenticated(): boolean {
		return this.authService.isAuthenticated();
	}

	/**
	 * Переключение состояния раскрытия списка справочников.
	 */
	toggleReferences(): void {
		this.isReferencesExpanded = !this.isReferencesExpanded;
	}

	/**
	 * Выход пользователя из системы.
	 */
	logout(): void {
		this.authService.logout();
		this.router.navigate(['/login']);
		console.log('Пользователь вышел из системы.');
	}

	/**
	 * Определяет, должен ли показываться основной контент.
	 */
	showContent(): boolean {
		return this.router.url !== '/login';
	}

	/**
	 * Настройка слушателей для отслеживания активности пользователя.
	 */
	private setupInactivityListeners(): void {
		const events = ['click', 'keydown'];

		events.forEach(event => {
			const listener = () => this.authService.resetInactivityTimer();
			document.addEventListener(event, listener);
			this.inactivityListeners.push(() => document.removeEventListener(event, listener));
		});

		console.log('Отслеживание активности пользователя включено.');
	}

	/**
	 * Очистка слушателей при уничтожении компонента.
	 */
	ngOnDestroy(): void {
		this.inactivityListeners.forEach(removeListener => removeListener());
		console.log('Слушатели активности пользователя удалены.');
	}

	/**
	 * Переключение состояния раскрытия списка транзакций.
	 */
	toggleTransactions(): void {
		this.isTransactionsExpanded = !this.isTransactionsExpanded;
	}
}
