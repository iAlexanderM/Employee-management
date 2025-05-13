export interface ChangeValue {
	oldValue: any;
	newValue: any;
}

export interface HistoryEntry {
	id: number;
	entityType: string;
	entityId: string;
	action: string;
	details?: string;
	changes: { [key: string]: ChangeValue };
	user: string;
	timestamp: Date;
}