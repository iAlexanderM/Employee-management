import { Routes } from '@angular/router';
import { PositionCreateComponent } from '../components/position/position-create/position-create.component';
import { PositionListComponent } from '../components/position/position-list/position-list.component';
import { PositionDetailsComponent } from '../components/position/position-details/position-details.component';
import { PositionEditComponent } from '../components/position/position-edit/position-edit.component';
import { AuthGuard } from '../guards/auth.guard';

export const positionRoutes: Routes = [
	{ path: 'positions', component: PositionListComponent },
	{ path: 'positions/new', component: PositionCreateComponent },
	{ path: 'positions/details/:id', component: PositionDetailsComponent },
	{ path: 'positions/edit/:id', component: PositionEditComponent }
]