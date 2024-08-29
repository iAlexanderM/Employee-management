// src/app/services/contractor.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
	providedIn: 'root'
})
export class ContractorService {
	private apiUrl = 'http://localhost:5290/api/contractors';

	constructor(private http: HttpClient) { }

	getContractors(): Observable<any[]> {
		return this.http.get<any[]>(this.apiUrl).pipe(
			catchError(this.handleError)
		);
	}

	getContractorById(id: number): Observable<any> {
		return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
			catchError(this.handleError)
		);
	}

	createContractor(contractor: any): Observable<any> {
		return this.http.post<any>(this.apiUrl, contractor).pipe(
			catchError(this.handleError)
		);
	}

	updateContractor(id: number, contractor: any): Observable<any> {
		return this.http.put<any>(`${this.apiUrl}/${id}`, contractor).pipe(
			catchError(this.handleError)
		);
	}

	archiveContractor(id: number): Observable<any> {
		return this.http.delete<any>(`${this.apiUrl}/archive/${id}`).pipe(
			catchError(this.handleError)
		);
	}

	private handleError(error: HttpErrorResponse): Observable<never> {
		console.error('An error occurred:', error.message);
		return throwError(() => new Error('Что-то пошло не так; пожалуйста, попробуйте позже.'));
	}
}
