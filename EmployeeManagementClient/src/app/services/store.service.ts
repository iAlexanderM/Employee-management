import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '../models/store.model';

@Injectable({
	providedIn: 'root'
})
export class StoreService {
	private apiUrl = 'http://localhost:5290/api/Stores';  // Обновленный URL API бэкенда

	constructor(private http: HttpClient) { }

	// Получение списка всех торговых точек
	getAllStores(): Observable<Store[]> {
		return this.http.get<Store[]>(`${this.apiUrl}`);
	}

	// Получение торговой точки по ID
	getStoreById(id: string): Observable<Store> {
		return this.http.get<Store>(`${this.apiUrl}/${id}`);
	}

	// Создание новой торговой точки
	createStore(store: Store): Observable<Store> {
		return this.http.post<Store>(`${this.apiUrl}`, store);
	}

	// Обновление данных торговой точки
	updateStore(id: string, store: Store): Observable<void> {
		return this.http.put<void>(`${this.apiUrl}/${id}`, store);
	}
}
