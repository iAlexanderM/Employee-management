import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '../models/store.model';

@Injectable({
	providedIn: 'root'
})
export class StoreService {

	constructor(private http: HttpClient) { }

	getStores(): Observable<Store[]> {
		return this.http.get<Store[]>('/api/stores');
	}

	getStoreById(id: string): Observable<Store> {
		return this.http.get<Store>(`/api/stores/${id}`);
	}

	addStore(store: Store): Observable<Store> {
		return this.http.post<Store>('/api/stores', store);
	}

	updateStore(id: string, store: Store): Observable<Store> {
		return this.http.put<Store>(`/api/stores/${id}`, store);
	}
}
