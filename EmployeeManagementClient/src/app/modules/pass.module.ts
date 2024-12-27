import { Routes } from '@angular/router';
import { PassGroupListComponent } from '../../app/components/pass/pass-group/pass-group-list/pass-group-list.component';
import { PassGroupCreateComponent } from '../../app/components/pass/pass-group/pass-group-create/pass-group-create.component';
import { PassGroupEditComponent } from '../../app/components/pass/pass-group/pass-group-edit/pass-group-edit.component';
import { PassGroupDetailsComponent } from '../../app/components/pass/pass-group/pass-group-details/pass-group-details.component';

import { PassTypeListComponent } from '../../app/components/pass/pass-type/pass-type-list/pass-type-list.component';
import { PassTypeCreateComponent } from '../../app/components/pass/pass-type/pass-type-create/pass-type-create.component';
import { PassTypeEditComponent } from '../../app/components/pass/pass-type/pass-type-edit/pass-type-edit.component';
import { PassTypeDetailsComponent } from '../../app/components/pass/pass-type/pass-type-details/pass-type-details.component';


export const passRoutes: Routes = [
	// Маршруты для групп пропусков
	{ path: 'pass-groups', component: PassGroupListComponent },
	{ path: 'pass-groups/create', component: PassGroupCreateComponent },
	{ path: 'pass-groups/:id/edit', component: PassGroupEditComponent },
	{ path: 'pass-groups/:id/details', component: PassGroupDetailsComponent },

	// Маршруты для типов пропусков
	{ path: 'pass-types', component: PassTypeListComponent },
	{ path: 'pass-types/create', component: PassTypeCreateComponent },
	{ path: 'pass-types/:id/edit', component: PassTypeEditComponent },
	{ path: 'pass-types/:id/details', component: PassTypeDetailsComponent },

];
