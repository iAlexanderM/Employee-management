// src/app/services/contractor-edit.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contractor, Photo } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorEditService {
	private apiUrl = 'http://localhost:8080/api/contractors/edit';

	constructor(private http: HttpClient) { }

	updateContractor(id: string, contractorData: any): Observable<any> {
		const formData = this.buildFormData(contractorData);
		return this.http.put(`${this.apiUrl}/${id}`, formData);
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
				} else if (contractorData[key] !== null && contractorData[key] !== undefined) {
					if (contractorData[key] instanceof Date) {
						formData.append(key, contractorData[key].toISOString());
					} else if (typeof contractorData[key] === 'boolean') {
						formData.append(key, contractorData[key].toString());
					}
					else {
						formData.append(key, contractorData[key]);
					}
				}
			}
		}
		return formData;
	}
}