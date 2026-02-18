import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { BootstrapService } from './core/bootstrap.service';
import { SessionService, RuntimeConfig } from './core/session.service';
import { authInterceptor } from './core/auth.interceptor';
import { firstValueFrom } from 'rxjs';

// Factory to load terminal/user context before App starts
function initializeApp(bootstrapService: BootstrapService, sessionService: SessionService) {
  return () => firstValueFrom(bootstrapService.loadRuntime()).then((config) => {
    sessionService.init(config as RuntimeConfig);
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()), // Hash location for Applet compatibility
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [BootstrapService, SessionService],
      multi: true
    }
  ]
};