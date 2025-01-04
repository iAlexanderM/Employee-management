// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './modules/app-routing.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptor/auth.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(appRoutes),
		provideHttpClient(
			withInterceptors([authInterceptor])
		),
		importProvidersFrom(
			ReactiveFormsModule,
			BrowserAnimationsModule
		)
	]
};
