import { Routes } from '@angular/router';
import { ContractorListComponent } from '../components/contractor/contractor-list/contractor-list.component';
import { ContractorCreateComponent } from '../components/contractor/contractor-create/contractor-create.component';
import { ContractorEditComponent } from '../components/contractor/contractor-edit/contractor-edit.component';
import { ContractorDetailsComponent } from '../components/contractor/contractor-details/contractor-details.component';
import { AuthGuard } from '../guards/auth.guard';

export const contractorRoutes: Routes = [
	{ path: 'contractors', component: ContractorListComponent, canActivate: [AuthGuard] },
	{ path: 'contractors/new', component: ContractorCreateComponent, canActivate: [AuthGuard] },
	{ path: 'contractors/edit/:id', component: ContractorEditComponent, canActivate: [AuthGuard] },
	{ path: 'contractors/details/:id', component: ContractorDetailsComponent, canActivate: [AuthGuard] },
];
