import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { MessageService } from 'primeng/api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: false }
      }
    }),
    MessageService
  ]
};