import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../components/login/login.component';
import { AuthGuard } from '../guards/auth.guard';

// Import модулей для маршрутов
import { contractorRoutes } from './contractor.module';
import { storeRoutes } from './store.module';
import { contractorPointsRoutes } from './contractorPoints.module';
import { storePointsRoutes } from './storePoints.module';

const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	...contractorRoutes,
	...storeRoutes,
	...storePointsRoutes,
	...contractorPointsRoutes,
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
	{ path: '**', redirectTo: '/login', pathMatch: 'full' }
];

export const appRoutes = routes; // Экспорт маршрутов

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
