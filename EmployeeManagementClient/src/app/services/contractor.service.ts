import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Contractor } from '../models/contractor.model';

@Injectable({
	providedIn: 'root'
})
export class ContractorService {

	constructor(private http: HttpClient) { }

	getContractors(): Observable<Contractor[]> {
		return this.http.get<Contractor[]>('/api/contractors');
	}

	getContractorById(id: string): Observable<Contractor> {
		return this.http.get<Contractor>(`/api/contractors/${id}`);
	}

	addContractor(contractorData: any): Observable<any> {
		const formData = new FormData();

		for (const key in contractorData) {
			if (contractorData.hasOwnProperty(key)) {
				if (key === 'photos') {
					contractorData.photos.forEach((photo: File) => {
						formData.append('photos', photo);
					});
				} else if (key === 'documentPhotos') {
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

	updateContractor(id: string, contractorData: any): Observable<any> {
		const formData = new FormData();

		for (const key in contractorData) {
			if (contractorData.hasOwnProperty(key)) {
				if (key === 'photos') {
					contractorData.photos.forEach((photo: File) => {
						formData.append('photos', photo);
					});
				} else if (key === 'documentPhotos') {
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

	archiveContractor(id: string): Observable<void> {
		return this.http.post<void>(`/api/contractors/${id}/archive`, {});
	}
}
