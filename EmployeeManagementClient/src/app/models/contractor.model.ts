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
	photo: string;
	documentPhotos: string[];
	isArchived: boolean;
}