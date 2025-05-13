import { Routes } from '@angular/router';
import { StoreListComponent } from '../components/store/store-list/store-list.component';
import { StoreCreateComponent } from '../components/store/store-create/store-create.component';
import { StoreEditComponent } from '../components/store/store-edit/store-edit.component';
//import { StoreDetailsComponent } from '../components/store/store-details/store-details.component';
import { AuthGuard } from '../guards/auth.guard';

export const storeRoutes: Routes = [
	{ path: 'stores', component: StoreListComponent, canActivate: [AuthGuard] },
	{ path: 'stores/new', component: StoreCreateComponent, canActivate: [AuthGuard] },
	{ path: 'stores/edit/:id', component: StoreEditComponent, canActivate: [AuthGuard] },
	//	{ path: 'stores/details/:id', component: StoreDetailsComponent, canActivate: [AuthGuard] },
];
