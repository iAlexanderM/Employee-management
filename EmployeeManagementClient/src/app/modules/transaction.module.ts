import { Routes } from '@angular/router';
import { TransactionListComponent } from '../components/transaction/transaction-list/transaction-list.component';
import { TransactionCreateComponent } from '../components/transaction/transaction-create/transaction-create.component';
import { TransactionDetailsComponent } from '../components/transaction/transaction-details/transaction-details.component';
import { AuthGuard } from '../guards/auth.guard';

export const transactionRoutes: Routes = [
	{ path: 'transactions', component: TransactionListComponent, canActivate: [AuthGuard] },
	{ path: 'transactions/create', component: TransactionCreateComponent, canActivate: [AuthGuard] },
	{ path: 'transactions/details/:id', component: TransactionDetailsComponent, canActivate: [AuthGuard] },
];
