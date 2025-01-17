import { Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';

import { passRoutes } from './pass.module';
import { contractorRoutes } from './contractor.module';
import { storeRoutes } from './store.module';
import { contractorPointsRoutes } from './contractorPoints.module';
import { storePointsRoutes } from './storePoints.module';
import { queueRoutes } from './queue.module';
import { transactionRoutes } from './transaction.module';

export const appRoutes: Routes = [
	{ path: 'login', component: LoginComponent },
	...contractorRoutes,
	...storeRoutes,
	...storePointsRoutes,
	...contractorPointsRoutes,
	...passRoutes,
	...queueRoutes,
	...transactionRoutes,
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
	{ path: '**', redirectTo: '/login', pathMatch: 'full' }
];
