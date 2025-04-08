import { Routes } from '@angular/router';
import { ContractorPointsCitizenshipCreateComponent } from '../components/contractor-points/contractor-points-citizenship/contractor-points-citizenship-create/contractor-points-citizenship-create.component';
import { ContractorPointsCitizenshipListComponent } from '../components/contractor-points/contractor-points-citizenship/contractor-points-citizenship-list/contractor-points-citizenship-list.component';
import { ContractorPointsCitizenshipDetailsComponent } from '../components/contractor-points/contractor-points-citizenship/contractor-points-citizenship-details/contractor-points-citizenship-details.component';
import { ContractorPointsCitizenshipEditComponent } from '../components/contractor-points/contractor-points-citizenship/contractor-points-citizenship-edit/contractor-points-citizenship-edit.component';
import { ContractorPointsNationalityCreateComponent } from '../components/contractor-points/contractor-points-nationality/contractor-points-nationality-create/contractor-points-nationality-create.component';
import { ContractorPointsNationalityListComponent } from '../components/contractor-points/contractor-points-nationality/contractor-points-nationality-list/contractor-points-nationality-list.component';
import { ContractorPointsNationalityDetailsComponent } from '../components/contractor-points/contractor-points-nationality/contractor-points-nationality-details/contractor-points-nationality-details.component';
import { ContractorPointsNationalityEditComponent } from '../components/contractor-points/contractor-points-nationality/contractor-points-nationality-edit/contractor-points-nationality-edit.component';
import { AuthGuard } from '../guards/auth.guard';

export const contractorPointsRoutes: Routes = [
	{ path: 'nationality', component: ContractorPointsNationalityListComponent },
	{ path: 'nationality/new', component: ContractorPointsNationalityCreateComponent },
	{ path: 'nationality/details/:id', component: ContractorPointsNationalityDetailsComponent },
	{ path: 'nationality/edit/:id', component: ContractorPointsNationalityEditComponent },
	{ path: 'citizenship', component: ContractorPointsCitizenshipListComponent },
	{ path: 'citizenship/new', component: ContractorPointsCitizenshipCreateComponent },
	{ path: 'citizenship/details/:id', component: ContractorPointsCitizenshipDetailsComponent },
	{ path: 'citizenship/edit/:id', component: ContractorPointsCitizenshipEditComponent }
]