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
	passportSeries: string;
	passportNumber: string;
	passportIssuedBy: string;
	passportIssueDate: Date;
	productType: string;
	photos: Photo[];  
	documentPhotos: Photo[]; 
	isArchived: boolean;
}
