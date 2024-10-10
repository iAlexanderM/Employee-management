import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class ContractorEditService {

	constructor(private http: HttpClient) { }

	updateContractor(id: string, contractorData: any): Observable<any> {
		const formData = this.buildFormData(contractorData);

		// Добавляем идентификаторы удаленных фотографий
		if (contractorData.PhotosToRemove) {
			formData.append('PhotosToRemove', JSON.stringify(contractorData.PhotosToRemove));
		}
		if (contractorData.DocumentPhotosToRemove) {
			formData.append('DocumentPhotosToRemove', JSON.stringify(contractorData.DocumentPhotosToRemove));
		}

		return this.http.put(`/api/contractors/edit/${id}`, formData);
	}

	private buildFormData(contractorData: any): FormData {
		const formData = new FormData();

		// Обработка полей формы и файлов для Photos и DocumentPhotos
		for (const key in contractorData) {
			if (contractorData.hasOwnProperty(key)) {
				if (key === 'Photos' && contractorData.Photos) {
					contractorData.Photos.forEach((photo: File) => {
						formData.append('Photos', photo);
					});
				} else if (key === 'DocumentPhotos' && contractorData.DocumentPhotos) {
					contractorData.DocumentPhotos.forEach((photo: File) => {
						formData.append('DocumentPhotos', photo);
					});
				} else {
					formData.append(key, contractorData[key]);
				}
			}
		}

		return formData;
	}
}
