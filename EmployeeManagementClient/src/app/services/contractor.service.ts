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

	addContractor(contractor: Contractor): Observable<Contractor> {
		return this.http.post<Contractor>('/api/contractors', contractor);
	}

	updateContractor(id: string, contractor: Contractor): Observable<Contractor> {
		return this.http.put<Contractor>(`/api/contractors/${id}`, contractor);
	}

	archiveContractor(id: string): Observable<void> {
		return this.http.post<void>(`/api/contractors/${id}/archive`, {});
	}
}
