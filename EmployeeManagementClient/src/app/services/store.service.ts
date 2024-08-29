import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
	providedIn: 'root'
})
export class StoreService {

	private apiUrl = `${environment.apiUrl}/stores`;

	constructor(private http: HttpClient) { }

	getStores(): Observable<any[]> {
		return this.http.get<any[]>(this.apiUrl);
	}

	getStoreById(id: number): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/${id}`);
	}

	createStore(store: any): Observable<any> {
		return this.http.post<any>(this.apiUrl, store);
	}

	updateStore(id: number, store: any): Observable<any> {
		return this.http.put<any>(`${this.apiUrl}/${id}`, store);
	}

	// Добавляем метод archiveStore
	archiveStore(id: number): Observable<any> {
		return this.http.patch<any>(`${this.apiUrl}/${id}/archive`, {});
	}
}
