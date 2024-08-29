import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';  //Используется ngx-toastr для уведомлений

@Injectable({
	providedIn: 'root'
})
export class NotificationService {

	constructor(private toastr: ToastrService) { }

	showSuccess(message: string, title: string = 'Успех'): void {
		this.toastr.success(message, title);
	}

	showError(message: string, title: string = 'Ошибка'): void {
		this.toastr.error(message, title);
	}

	showInfo(message: string, title: string = 'Информация'): void {
		this.toastr.info(message, title);
	}

	showWarning(message: string, title: string = 'Предупреждение'): void {
		this.toastr.warning(message, title);
	}
}
