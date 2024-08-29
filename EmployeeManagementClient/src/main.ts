import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app-routing.module';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
	providers: [
		provideRouter(routes),
		provideHttpClient(),
		importProvidersFrom(
			ReactiveFormsModule,
			BrowserAnimationsModule
		)
	]
}).catch(err => console.error(err));
