import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class SearchFilterResetService {
	private resetSubject = new BehaviorSubject<boolean>(false);

	resetTrigger$ = this.resetSubject.asObservable();

	triggerReset(): void {
		console.log('SearchFilterResetService: Установка флага reset в true.');
		this.resetSubject.next(true);
	}

	consumeReset(): void {
		if (this.resetSubject.value === true) {
			console.log('SearchFilterResetService: Сброс флага reset в false.');
			this.resetSubject.next(false);
		}
	}
}