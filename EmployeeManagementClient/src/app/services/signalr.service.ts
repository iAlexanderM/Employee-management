// src/app/services/signalr.service.ts
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';  // <-- Подключаем ваш AuthService

@Injectable({
	providedIn: 'root'
})
export class SignalRService {
	private hubConnection!: signalR.HubConnection;

	// Внедряем AuthService через конструктор
	constructor(private authService: AuthService) { }

	/**
	 * Стартуем подключение к /hubs/queue
	 */
	public startConnection(): Promise<void> {
		this.hubConnection = new signalR.HubConnectionBuilder()
			.withUrl('http://localhost:8080/hubs/queue', {
				// Здесь берем токен из AuthService
				accessTokenFactory: () => {
					const token = this.authService.getToken();
					// Выводим в консоль, чтобы проверить
					console.log('SignalR attaching token:', token);
					// Если token === null или '', вернется пустая строка
					return token ?? '';
				}
			})
			.withAutomaticReconnect()
			.build();

		return this.hubConnection
			.start()
			.then(() => {
				console.log('SignalR connection established.');
			})
			.catch(err => {
				console.error('SignalR start error:', err);
				throw err;
			});
	}

	/**
	 * Подписка на событие 'QueueUpdated'
	 */
	public onQueueUpdated(callback: () => void): void {
		this.hubConnection.on('QueueUpdated', () => {
			console.log('SignalR: "QueueUpdated" event received');
			callback();
		});
	}

	// Пример вызова метода на сервере (если нужно)
	public pingServer(): void {
		this.hubConnection.invoke('Ping')
			.catch(err => console.error('Ping invoke error:', err));
	}
}
