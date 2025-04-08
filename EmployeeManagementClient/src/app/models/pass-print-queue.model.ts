export interface PassPrintQueueItem {
	transactionId: number;
	manager: string;
	queueNumber: string;
	serviceType: string;
	passCount: number;
	actions: string;
	passTypes: { id: number; color: string }[];
}