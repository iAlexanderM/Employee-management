// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContractorListComponent } from './components/contractor/contractor-list.component';
import { ContractorDetailsComponent } from './components/contractor/contractor-details.component';
import { ContractorFormComponent } from './components/contractor/contractor-form.component';
import { StoreListComponent } from './components/store/store-list.component';
import { StoreDetailsComponent } from './components/store/store-details.component';
import { StoreFormComponent } from './components/store/store-form.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
	{ path: '', redirectTo: '/contractors', pathMatch: 'full' },
	{ path: 'contractors', component: ContractorListComponent },
	{ path: 'contractor/add', component: ContractorFormComponent, canActivate: [AuthGuard] },
	{ path: 'contractor/:id', component: ContractorDetailsComponent },
	{ path: 'stores', component: StoreListComponent },
	{ path: 'store/add', component: StoreFormComponent, canActivate: [AuthGuard] },
	{ path: 'store/:id', component: StoreDetailsComponent },
	{ path: '**', redirectTo: '/contractors' }
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
