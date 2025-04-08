export interface Store {
	id: number;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	isArchived?: boolean;
	sortOrder: number;
	createdAt: Date;
}

