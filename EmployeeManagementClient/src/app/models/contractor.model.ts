export interface Contractor {
	id: string;
	firstName: string;
	lastName: string;
	middleName?: string;
	dateOfBirth: Date;
	documentType: string;
	passportSeries: string;
	passportNumber: string;
	passportIssuedBy: string;
	passportIssueDate: Date;
	productType: string;
	photo?: File;
	documentPhotos?: File[];
	isArchived: boolean;
}
