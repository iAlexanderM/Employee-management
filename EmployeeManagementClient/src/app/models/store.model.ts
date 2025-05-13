export interface Store {
	id: number;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	sortOrder: number;
	createdAt: Date | string;
	isArchived: boolean;
	[key: string]: any;
	note: string | null | undefined;
}

export interface StoreDto {
	id: number;
	building: string;
	floor: string;
	line: string;
	storeNumber: string;
	sortOrder: number;
	isArchived: boolean;
	createdAt: string;
	note: string | null;
}