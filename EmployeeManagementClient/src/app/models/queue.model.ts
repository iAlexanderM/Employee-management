// src/app/models/queue.model.ts
export interface QueueToken {
	id: number;
	token: string;
	tokenType: string;
	userId: string;
	status: string;
	createdAt: Date;
}