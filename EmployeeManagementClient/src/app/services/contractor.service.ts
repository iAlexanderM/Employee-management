import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contractor } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorService {

	constructor(private http: HttpClient) { }

	// Метод для получения всех контрагентов
	getContractors(): Observable<Contractor[]> {
		return this.http.get<{ data: Contractor[] }>('/api/contractors').pipe(
			map(response => response.data)
		);
	}

	// Метод для получения конкретного контрагента по ID
	getContractorById(id: string): Observable<Contractor> {
		return this.http.get<Contractor>(`/api/contractors/${id}`);
	}

	// Метод для добавления контрагента с использованием FormData
	addContractor(contractorData: any): Observable<any> {
		const formData = this.buildFormData(contractorData);
		return this.http.post('/api/contractors', formData);
	}

	// Метод для обновления контрагента с использованием FormData
	updateContractor(id: string, contractorData: any): Observable<any> {
		const formData = this.buildFormData(contractorData);
		return this.http.put(`/api/contractors/${id}`, formData);
	}

	// Метод для архивации контрагента
	archiveContractor(id: string): Observable<void> {
		return this.http.post<void>(`/api/contractors/${id}/archive`, {});
	}

	// Вспомогательный метод для подготовки FormData
	private buildFormData(contractorData: any): FormData {
		const formData = new FormData();

		// Обработка файлов для photos и documentPhotos
		for (const key in contractorData) {
			if (contractorData.hasOwnProperty(key)) {
				if (key === 'photos' && contractorData.photos.length > 0) {
					contractorData.photos.forEach((photo: File) => {
						formData.append('Photos', photo); // Используем ключ Photos для загрузки файлов
					});
				} else if (key === 'documentPhotos' && contractorData.documentPhotos.length > 0) {
					contractorData.documentPhotos.forEach((photo: File) => {
						formData.append('DocumentPhotos', photo); // Используем ключ DocumentPhotos для загрузки файлов
					});
				} else if (key === 'birthDate' || key === 'passportIssueDate') {
					// Преобразуем даты в формат ISO 8601
					const formattedDate = new Date(contractorData[key]).toISOString();
					formData.append(key, formattedDate);
				} else {
					formData.append(key, contractorData[key]);
				}
			}
		}

		return formData;
	}
}
