import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QueueComponent } from '../components/queue/queue.component';

export const queueRoutes: Routes = [
	{ path: 'queue', component: QueueComponent },
];

@NgModule({
	imports: [RouterModule.forChild(queueRoutes)],
	exports: [RouterModule],
})
export class QueueModule { }
