import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './modules/app-routing.module';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
	providers: [
		provideRouter(appRoutes),
		provideHttpClient(),
		importProvidersFrom(
			ReactiveFormsModule,
			BrowserAnimationsModule
		)
	]
};
