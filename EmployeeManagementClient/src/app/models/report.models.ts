// src/app/models/report.models.ts
export interface FinancialReportData {
	tokenType: string;
	paidAmount: number;
	transactionCount: number;
}

export interface PassTypeDetail {
	passType: string;
	amount: number;
	count: number;
}

export interface PassesSummaryReportData {
	queueType: string;
	totalAmount: number;
	passCount: number;
	showDetails?: boolean;
	passTypeDetails?: PassTypeDetail[] | null;
	isLoadingDetails?: boolean;
}
export interface IssuedPassesReportData {
	passType: string;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	contractorId: number;
	fullName: string;
	position: string;
	citizenship: string;
	nationality: string;
	startDate: string;
	endDate: string;
	status: string;
	phone: string;
	productType: string;
}

export interface ExpiringPassesReportData {
	passType: string;
	endDate: string;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	contractorId: number;
	fullName: string;
	position: string;
	note: string;
}

export interface ActivePassesReportData {
	index?: number;
	passType: string;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	contractorId: number;
	fullName: string;
	position: string;
	startDate: string;
	endDate: string;
	passNumber: string;
	citizenship?: string;
	nationality?: string;
	phone?: string;
	documentType?: string;
	passportSerialNumber?: string;
	passportIssuedBy?: string;
	passportIssueDate?: string;
	productType?: string;
	birthDate?: string;
}