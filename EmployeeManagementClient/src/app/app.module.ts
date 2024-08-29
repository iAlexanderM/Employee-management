import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ContractorListComponent } from './components/contractor/contractor-list/contractor-list.component';
import { ContractorFormComponent } from './components/contractor/contractor-form/contractor-form.component';
import { ContractorDetailsComponent } from './components/contractor/contractor-details/contractor-details.component';
import { StoreListComponent } from './components/store/store-list/store-list.component';
import { StoreFormComponent } from './components/store/store-form/store-form.component';
import { StoreDetailsComponent } from './components/store/store-details/store-details.component';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { ContractorService } from './services/contractor.service';
import { StoreService } from './services/store.service';
import { AuthGuard } from './guards/auth.guard';
import { FormatNamePipe } from '../app/components/pipes/format-name.pipe';
import { ArchiveContractorComponent } from './components/archive-contractor/archive-contractor.component';
import { PrintPassComponent } from './components/print-pass/print-pass.component';
import { RoleDirective } from './directives/role.directive';
import { AuthInterceptor } from './interceptor/auth.interceptor';

@NgModule({
	declarations: [
		AppComponent,
		ContractorListComponent,
		ContractorFormComponent,
		ContractorDetailsComponent,
		StoreListComponent,
		StoreFormComponent,
		StoreDetailsComponent,
		LoginComponent,
		FormatNamePipe,
		ArchiveContractorComponent,
		PrintPassComponent,
		RoleDirective,
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		ReactiveFormsModule,
		FormsModule,
		BrowserAnimationsModule,
	],
	providers: [
		AuthService,
		ContractorService,
		StoreService,
		AuthGuard,
		{
			provide: HTTP_INTERCEPTORS,
			useClass: AuthInterceptor,
			multi: true
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule { }