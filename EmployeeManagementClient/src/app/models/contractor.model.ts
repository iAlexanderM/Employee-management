export interface Photo {
	id: number;
	filePath: string;
	isDocumentPhoto: boolean;
	contractorId: number;
}

export interface Contractor {
	id: string;
	firstName: string;
	lastName: string;
	middleName?: string;
	birthDate: Date;
	documentType: string;
	passportSerialNumber: string;
	passportIssuedBy: string;
	citizenship: string;
	nationality: string;
	passportIssueDate: Date;
	productType: string;
	photos: Photo[];
	documentPhotos: Photo[];
	isArchived: boolean;
}
