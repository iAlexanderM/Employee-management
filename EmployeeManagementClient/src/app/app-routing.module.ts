import { Routes } from '@angular/router';
import { ContractorListComponent } from './components/contractor/contractor-list/contractor-list.component';
import { ContractorFormComponent } from './components/contractor/contractor-form/contractor-form.component';
import { ContractorDetailsComponent } from './components/contractor/contractor-details/contractor-details.component';
import { StoreListComponent } from './components/store/store-list/store-list.component';
import { StoreFormComponent } from './components/store/store-form/store-form.component';
import { StoreDetailsComponent } from './components/store/store-details/store-details.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './guards/auth.guard'; // Если есть guard для маршрутов

export const routes: Routes = [
  { path: 'login', component: LoginComponent },  // Страница логина
  { path: 'contractors', component: ContractorListComponent, canActivate: [AuthGuard] },  // Список контрагентов
  { path: 'contractors/new', component: ContractorFormComponent, canActivate: [AuthGuard] },  // Форма создания нового контрагента
  { path: 'contractors/edit/:id', component: ContractorFormComponent, canActivate: [AuthGuard] },  // Форма редактирования контрагента
  { path: 'contractors/details/:id', component: ContractorDetailsComponent, canActivate: [AuthGuard] },  // Детали контрагента
  { path: 'stores', component: StoreListComponent, canActivate: [AuthGuard] },  // Список магазинов
  { path: 'stores/new', component: StoreFormComponent, canActivate: [AuthGuard] },  // Форма создания нового магазина
  { path: 'stores/edit/:id', component: StoreFormComponent, canActivate: [AuthGuard] },  // Форма редактирования магазина
  { path: 'stores/details/:id', component: StoreDetailsComponent, canActivate: [AuthGuard] },  // Детали магазина
  { path: '', redirectTo: '/login', pathMatch: 'full' },  // Перенаправление на страницу логина
  { path: '**', redirectTo: '/login', pathMatch: 'full' }  // Перенаправление на логин для всех неизвестных маршрутов
];
