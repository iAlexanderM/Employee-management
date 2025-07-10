import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';

@Injectable({
	providedIn: 'root'
})
export class SignalRService {
	private hubConnection!: signalR.HubConnection;

	constructor(private authService: AuthService) { }

	public startConnection(): Promise<void> {
		this.hubConnection = new signalR.HubConnectionBuilder()
			.withUrl('http://localhost:8080/hubs/queue', {
				accessTokenFactory: () => {
					const accessToken = this.authService.getAccessToken();
					console.log('SignalR attaching accessToken:', accessToken?.substring(0, 50) + '...');
					return accessToken ?? '';
				},
				transport: signalR.HttpTransportType.WebSockets
			})
			.withAutomaticReconnect()
			.configureLogging(signalR.LogLevel.Information)
			.build();

		return this.hubConnection
			.start()
			.then(() => {
				console.log('SignalR connection established with WebSocket.');
			})
			.catch(err => {
				console.error('SignalR start error:', err);
				throw err;
			});
	}

	public onQueueUpdated(callback: () => void): void {
		this.hubConnection.on('QueueUpdated', () => {
			console.log('SignalR: "QueueUpdated" event received');
			callback();
		});
	}

	public stopConnection(): void {
		this.hubConnection.stop()
			.then(() => console.log('SignalR connection stopped'))
			.catch(err => console.error('SignalR stop error:', err));
	}
}