import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContractorListComponent } from './components/contractor/contractor-list/contractor-list.component';
import { ContractorDetailsComponent } from './components/contractor/contractor-details/contractor-details.component';
import { ContractorFormComponent } from './components/contractor/contractor-form/contractor-form.component';
import { StoreListComponent } from './components/store/store-list/store-list.component';
import { StoreDetailsComponent } from './components/store/store-details/store-details.component';
import { StoreFormComponent } from './components/store/store-form/store-form.component';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptor/auth.interceptor';

@NgModule({
	declarations: [
		AppComponent,
		ContractorListComponent,
		ContractorDetailsComponent,
		ContractorFormComponent,
		StoreListComponent,
		StoreDetailsComponent,
		StoreFormComponent,
		LoginComponent
	],
	imports: [
		BrowserModule,
		CommonModule,
		AppRoutingModule,
		HttpClientModule,
		ReactiveFormsModule,
		FormsModule,
		RouterModule,
		BrowserAnimationsModule
	],
	providers: [
		AuthService,
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
