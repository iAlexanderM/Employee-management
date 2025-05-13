import { Pass } from './pass.model';

export interface Photo {
	id: number;
	filePath: string;
	isDocumentPhoto: boolean;
	contractorId: number;
}

export interface Contractor {
	id: number;
	firstName: string;
	lastName: string;
	middleName?: string;
	birthDate?: Date;
	documentType: string;
	passportSerialNumber: string;
	passportIssuedBy: string;
	citizenship: string;
	nationality: string;
	passportIssueDate?: Date;
	productType: string;
	phoneNumber: string;
	createdAt: Date;
	sortOrder: number;
	photos: Photo[];
	documentPhotos: Photo[];
	isArchived: boolean;
	passes: Pass[];
	note?: string;
	[key: string]: any;
}

export interface ContractorDto {
	id: number;
	firstName: string;
	lastName: string;
	middleName?: string;
	birthDate: string;
	citizenship: string;
	nationality: string;
	documentType: string;
	passportSerialNumber: string;
	passportIssuedBy: string;
	passportIssueDate: string;
	phoneNumber: string;
	productType: string;
	isArchived: boolean;
	createdAt: string;
	sortOrder?: number;
	photos: Photo[];
	documentPhotos: Photo[];
	passes: Pass[];
	note?: string;
}