import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { AuthGuard } from '../guards/auth.guard';
import { TransactionDetailsComponent } from '../components/transaction/transaction-details/transaction-details.component';

import { passRoutes } from './pass.module';
import { contractorRoutes } from './contractor.module';
import { storeRoutes } from './store.module';
import { contractorPointsRoutes } from './contractorPoints.module';
import { storePointsRoutes } from './storePoints.module';
import { queueRoutes } from './queue.module';

const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	...contractorRoutes,
	...storeRoutes,
	...storePointsRoutes,
	...contractorPointsRoutes,
	...passRoutes,
	...queueRoutes,
	{ path: 'transaction/:id', component: TransactionDetailsComponent },
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
	{ path: '**', redirectTo: '/login', pathMatch: 'full' }
];

export const appRoutes = routes;

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule { }
