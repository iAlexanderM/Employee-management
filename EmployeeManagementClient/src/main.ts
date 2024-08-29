import { provideClientHydration } from '@angular/platform-browser';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
	providers: [provideClientHydration(), ...appConfig.providers],
}).catch(err => console.error(err));
