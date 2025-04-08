export interface Building {
	id?: number;
	name: string;
	sortOrder: number;
	createdAt: Date;
	isArchived: boolean;
}

export interface Floor {
	id?: number;
	name: string;
	sortOrder: number;
	createdAt: Date;
	isArchived?: boolean;
}

export interface Line {
	id?: number;
	name: string;
	sortOrder: number;
	createdAt: Date;
	isArchived?: boolean;
}

export interface StoreNumber {
	id?: number;
	name: string;
	sortOrder: number;
	createdAt: Date;
	isArchived?: boolean;
}