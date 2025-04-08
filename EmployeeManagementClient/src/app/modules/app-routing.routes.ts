import { Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { AddUserComponent } from '../components/add-user/add-user.component';
import { AuthGuard } from '../guards/auth.guard';

import { passGroupRoutes, passPrintRoutes, storePassSearchRoutes } from './pass.module';
import { contractorRoutes } from './contractor.module';
import { storeRoutes } from './store.module';
import { contractorPointsRoutes } from './contractorPoints.module';
import { storePointsRoutes } from './storePoints.module';
import { queueRoutes } from './queue.module';
import { transactionRoutes } from './transaction.module';
import { positionRoutes } from './position.module';

import { reportRoutes } from './report.module';

export const appRoutes: Routes = [
	{ path: 'login', component: LoginComponent },
	{ path: 'add-user', component: AddUserComponent, canActivate: [AuthGuard] },
	...contractorRoutes,
	...storeRoutes,
	...storePointsRoutes,
	...contractorPointsRoutes,
	...queueRoutes,
	...passGroupRoutes,
	{
		path: 'reports',
		children: reportRoutes
	},
	{ path: 'passes', children: passPrintRoutes },
	{ path: 'passes', children: storePassSearchRoutes },
	...transactionRoutes,
	...positionRoutes,
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
	{ path: '**', redirectTo: '/login', pathMatch: 'full' }
];
