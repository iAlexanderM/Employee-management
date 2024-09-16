import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';  // Добавляем оператор map для обработки ответа
import { Contractor } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorService {

	constructor(private http: HttpClient) { }

	// Метод для получения всех контрагентов
	getContractors(): Observable<Contractor[]> {
		return this.http.get<{ data: Contractor[] }>('/api/contractors').pipe(
			map(response => response.data.map(contractor => {
				// Приведение photos к массиву строк
				contractor.photos = this.normalizePhotos(contractor.photos);
				return contractor;
			}))
		);
	}

	// Приведение photos к массиву строк
	private normalizePhotos(photos: string[] | { $values: string[] }): string[] {
		if (photos && typeof photos === 'object' && '$values' in photos) {
			return photos.$values;
		}
		return photos as string[];
	}

	// Метод для получения конкретного контрагента по ID
	getContractorById(id: string): Observable<Contractor> {
		return this.http.get<Contractor>(`/api/contractors/${id}`);
	}

	// Метод для добавления контрагента с использованием FormData
	addContractor(contractorData: any): Observable<any> {
		const formData = new FormData();

		for (const key in contractorData) {
			if (contractorData.hasOwnProperty(key)) {
				if (key === 'photos' && contractorData.photos.length > 0) {
					contractorData.photos.forEach((photo: File) => {
						formData.append('photos', photo);
					});
				} else if (key === 'documentPhotos' && contractorData.documentPhotos.length > 0) {
					contractorData.documentPhotos.forEach((photo: File) => {
						formData.append('documentPhotos', photo);
					});
				} else {
					formData.append(key, contractorData[key]);
				}
			}
		}

		return this.http.post('/api/contractors', formData);
	}

	// Метод для обновления контрагента
	updateContractor(id: string, contractorData: any): Observable<any> {
		const formData = new FormData();

		for (const key in contractorData) {
			if (contractorData.hasOwnProperty(key)) {
				if (key === 'photos' && contractorData.photos.length > 0) {
					contractorData.photos.forEach((photo: File) => {
						formData.append('photos', photo);
					});
				} else if (key === 'documentPhotos' && contractorData.documentPhotos.length > 0) {
					contractorData.documentPhotos.forEach((photo: File) => {
						formData.append('documentPhotos', photo);
					});
				} else {
					formData.append(key, contractorData[key]);
				}
			}
		}

		return this.http.put(`/api/contractors/${id}`, formData);
	}

	// Метод для архивации контрагента
	archiveContractor(id: string): Observable<void> {
		return this.http.post<void>(`/api/contractors/${id}/archive`, {});
	}
}
