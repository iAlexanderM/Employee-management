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

		console.log('Данные для отправки на сервер в сервисе:', contractorData);
		return this.http.put(`/api/contractors/edit/${id}`, formData);
	}

	private buildFormData(contractorData: any): FormData {
		const formData = new FormData();

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
				} else if (key === 'PhotosToRemove' && Array.isArray(contractorData.PhotosToRemove)) {
					contractorData.PhotosToRemove.forEach((photoId: number) => {
						formData.append('PhotosToRemove', photoId.toString());
					});
				} else {
					formData.append(key, contractorData[key]);
				}
			}
		}

		return formData;
	}
}
