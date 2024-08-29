import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContractorListComponent } from './components/contractor/contractor-list/contractor-list.component';
import { ContractorDetailsComponent } from './components/contractor/contractor-details/contractor-details.component';
import { ContractorFormComponent } from './components/contractor/contractor-form/contractor-form.component';
import { StoreListComponent } from './components/store/store-list/store-list.component';
import { StoreDetailsComponent } from './components/store/store-details/store-details.component';
import { StoreFormComponent } from './components/store/store-form/store-form.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: '', component: ContractorListComponent },
	{ path: 'contractor/details/:id', component: ContractorDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'contractor/form', component: ContractorFormComponent, canActivate: [AuthGuard] },
	{ path: 'store/list', component: StoreListComponent },
	{ path: 'store/details/:id', component: StoreDetailsComponent, canActivate: [AuthGuard] },
	{ path: 'store/form', component: StoreFormComponent, canActivate: [AuthGuard] },
	{ path: 'login', component: LoginComponent }
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
