// src/app/services/pass.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pass } from '../models/pass.model';
import { environment } from '../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class PassService {
	private baseUrl = `${environment.apiUrl}/Pass`;

	constructor(private http: HttpClient) { }

	getAllPasses(): Observable<Pass[]> {
		return this.http.get<Pass[]>(this.baseUrl);
	}

	getPassById(id: number): Observable<Pass> {
		return this.http.get<Pass>(`${this.baseUrl}/${id}`);
	}

	closePass(id: number, closeReason: string): Observable<void> {
		return this.http.post<void>(`${this.baseUrl}/${id}/close`, { closeReason });
	}

	createPass(passData: Pass): Observable<Pass> {
		return this.http.post<Pass>(this.baseUrl, passData);
	}
}
