import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QueueSyncService {
	private activeTokenSubject = new BehaviorSubject<string>('');
	activeToken$ = this.activeTokenSubject.asObservable();

	setActiveToken(token: string) {
		if (!token && this.activeTokenSubject.value) {
			console.log(`QueueSyncService: Clearing transaction forms from localStorage for token ${this.activeTokenSubject.value}`);
			localStorage.removeItem(`transactionForms_${this.activeTokenSubject.value}`);
		}
		localStorage.setItem('active_token', token);
		this.activeTokenSubject.next(token);
		console.log(`QueueSyncService: Active token set to ${token}`);
	}

	getActiveToken(): string {
		return localStorage.getItem('active_token') || '';
	}
}