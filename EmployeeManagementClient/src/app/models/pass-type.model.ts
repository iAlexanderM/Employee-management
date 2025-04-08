export interface PassType {
	id: number;
	name: string;
	durationInMonths: number;
	cost: number;
	printTemplate: string;
	isArchived: boolean;
	sortOrder: number;
	color: string;
	passGroupId: number;
}
