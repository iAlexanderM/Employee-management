import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Contractor, Photo } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorService {

	constructor(private http: HttpClient) { }

	getContractors(): Observable<Contractor[]> {
		return this.http.get<{ $values: Contractor[] }>('/api/contractors').pipe(
			map(response => {
				// Проверяем, содержит ли ответ поле $values и является ли оно массивом
				if (response && Array.isArray(response.$values)) {
					return response.$values.map(contractor => {
						// Нормализуем массив фотографий
						contractor.photos = this.normalizePhotos(contractor.photos);
						contractor.documentPhotos = this.normalizePhotos(contractor.documentPhotos);
						return contractor;
					});
				} else {
					console.error('Ответ от сервера не содержит массив контрагентов:', response);
					return [];
				}
			})
		);
	}
	
	// Приведение photos к массиву объектов Photo
	private normalizePhotos(photos: any): Photo[] {
		if (photos && typeof photos === 'object' && '$values' in photos) {
			return photos.$values;
		}
		return photos;
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
				if (key === 'Photos' && contractorData.photos.length > 0) {
					contractorData.photos.forEach((photo: File) => {
						formData.append('Photos', photo);
					});
				} else if (key === 'DocumentPhotos' && contractorData.documentPhotos.length > 0) {
					contractorData.documentPhotos.forEach((photo: File) => {
						formData.append('DocumentPhotos', photo);
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
				if (key === 'Photos' && contractorData.photos.length > 0) {
					contractorData.photos.forEach((photo: File) => {
						formData.append('Photos', photo);
					});
				} else if (key === 'DocumentPhotos' && contractorData.documentPhotos.length > 0) {
					contractorData.documentPhotos.forEach((photo: File) => {
						formData.append('DocumentPhotos', photo);
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
