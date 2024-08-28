import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContractorListComponent } from './components/contractor/contractor-list.component';
import { ContractorDetailsComponent } from './components/contractor/contractor-details.component';
import { ContractorFormComponent } from './components/contractor/contractor-form.component';
import { StoreListComponent } from './components/store/store-list.component';
import { StoreDetailsComponent } from './components/store/store-details.component';
import { StoreFormComponent } from './components/store/store-form.component';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
	declarations: [
		AppComponent,
		ContractorListComponent,
		ContractorDetailsComponent,
		ContractorFormComponent,
		StoreListComponent,
		StoreDetailsComponent,
		StoreFormComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		HttpClientModule,
		ReactiveFormsModule,
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
