import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ContractorCreateService {

	constructor(private http: HttpClient) { }

	addContractor(contractorData: any): Observable<any> {
		const formData = this.buildFormData(contractorData);
		return this.http.post('/api/contractors', formData);
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
