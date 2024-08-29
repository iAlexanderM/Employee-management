import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContractorListComponent } from './components/contractor/contractor-list/contractor-list.component';
import { ContractorFormComponent } from './components/contractor/contractor-form/contractor-form.component';
import { ContractorDetailsComponent } from './components/contractor/contractor-details/contractor-details.component';
import { StoreListComponent } from './components/store/store-list/store-list.component';
import { StoreFormComponent } from './components/store/store-form/store-form.component';
import { StoreDetailsComponent } from './components/store/store-details/store-details.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: 'login', component: LoginComponent },
	{ path: 'contractors', component: ContractorListComponent, canActivate: [AuthGuard] },
	{ path: 'contractors/new', component: ContractorFormComponent, canActivate: [AuthGuard] },
	{ path: 'contractors/edit/:id', component: ContractorFormComponent, canActivate: [AuthGuard] },
	{ path: 'contractors/details/:id', component: ContractorDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'stores', component: StoreListComponent, canActivate: [AuthGuard] },
	{ path: 'stores/new', component: StoreFormComponent, canActivate: [AuthGuard] },
	{ path: 'stores/edit/:id', component: StoreFormComponent, canActivate: [AuthGuard] },
	{ path: '', redirectTo: '/login', pathMatch: 'full' },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
