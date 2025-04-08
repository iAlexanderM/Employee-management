import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QueueSyncService {
	private activeTokenSubject = new BehaviorSubject<string>('');
	activeToken$ = this.activeTokenSubject.asObservable();

	setActiveToken(token: string) {
		this.activeTokenSubject.next(token);
		localStorage.setItem('active_token', token);
	}

	getActiveToken(): string {
		return localStorage.getItem('active_token') || '';
	}
}