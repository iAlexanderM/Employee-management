import { Routes } from '@angular/router';
import { PassGroupListComponent } from '../../app/components/pass/pass-group/pass-group-list/pass-group-list.component';
import { PassGroupCreateComponent } from '../../app/components/pass/pass-group/pass-group-create/pass-group-create.component';
import { PassGroupEditComponent } from '../../app/components/pass/pass-group/pass-group-edit/pass-group-edit.component';
import { PassGroupDetailsComponent } from '../../app/components/pass/pass-group/pass-group-details/pass-group-details.component';

import { PassTypeListComponent } from '../../app/components/pass/pass-type/pass-type-list/pass-type-list.component';
import { PassTypeCreateComponent } from '../../app/components/pass/pass-type/pass-type-create/pass-type-create.component';
import { PassTypeEditComponent } from '../../app/components/pass/pass-type/pass-type-edit/pass-type-edit.component';
import { PassTypeDetailsComponent } from '../../app/components/pass/pass-type/pass-type-details/pass-type-details.component';

import { PassPrintQueueComponent } from '../../app/components/pass/pass-print-queue/pass-print-queue.component';
import { PrintPassComponent } from '../../app/components/pass/print-pass/print-pass.component';
import { IssuedPassesComponent } from '../components/pass/issued-passes/issued-passes.component';

import { StorePassSearchComponent } from '../components/store-pass-search/store-pass-search.component';

export const passGroupRoutes: Routes = [
	{ path: 'pass-groups', component: PassGroupListComponent },
	{ path: 'pass-groups/create', component: PassGroupCreateComponent },
	{ path: 'pass-groups/:id/edit', component: PassGroupEditComponent },
	{ path: 'pass-groups/:id/details', component: PassGroupDetailsComponent },
	{ path: 'pass-types', component: PassTypeListComponent },
	{ path: 'pass-types/create', component: PassTypeCreateComponent },
	{ path: 'pass-types/:id/edit', component: PassTypeEditComponent },
	{ path: 'pass-types/:id/details', component: PassTypeDetailsComponent },
];

export const passPrintRoutes: Routes = [
	{ path: 'print-queue', component: PassPrintQueueComponent },
	{ path: 'print/:id', component: PrintPassComponent },
	{ path: 'issued', component: IssuedPassesComponent },
];

export const storePassSearchRoutes: Routes = [
	{ path: 'store-pass-search', component: StorePassSearchComponent },
];

export const passRoutes: Routes = [
	...passGroupRoutes,
	...passPrintRoutes,
	...storePassSearchRoutes,
];
