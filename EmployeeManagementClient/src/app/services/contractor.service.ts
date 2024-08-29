import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contractor } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorService {
	private apiUrl = 'http://localhost:5290/api/Contractors';  // Обновленный URL API бэкенда

	constructor(private http: HttpClient) { }

	// Получение списка всех контрагентов
	getAllContractors(): Observable<Contractor[]> {
		return this.http.get<Contractor[]>(`${this.apiUrl}`);
	}

	// Получение контрагента по ID
	getContractorById(id: string): Observable<Contractor> {
		return this.http.get<Contractor>(`${this.apiUrl}/${id}`);
	}

	// Создание нового контрагента
	createContractor(contractor: Contractor): Observable<Contractor> {
		return this.http.post<Contractor>(`${this.apiUrl}`, contractor);
	}

	// Обновление данных контрагента
	updateContractor(id: string, contractor: Contractor): Observable<void> {
		return this.http.put<void>(`${this.apiUrl}/${id}`, contractor);
	}

	// Архивирование контрагента
	archiveContractor(id: string): Observable<void> {
		return this.http.patch<void>(`${this.apiUrl}/archive/${id}`, {});
	}
}
