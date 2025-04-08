// src/app/app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './modules/app-routing.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { authInterceptor } from './interceptor/auth.interceptor';

// Добавляем импорт OverlayModule и OverlayContainer
import { OverlayModule, OverlayContainer } from '@angular/cdk/overlay';
import { CustomOverlayContainer } from './shared/custom-overlay-container'; // путь к вашему файлу

export const appConfig: ApplicationConfig = {
	providers: [
		// Роутинг
		provideRouter(appRoutes),

		// HttpClient + ваш интерсептор
		provideHttpClient(withInterceptors([authInterceptor])),

		importProvidersFrom(
			ReactiveFormsModule,
			BrowserAnimationsModule,
			OverlayModule // <-- важно
		),

		{
			provide: OverlayContainer,
			useClass: CustomOverlayContainer
		}
	]
};
