import { ApplicationConfig } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideIonicAngular} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Routing global
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // HTTP Client dengan interceptor
    provideHttpClient(withInterceptors([authInterceptor])),
    provideIonicAngular(),
  ]
};

// 🔥 Daftarkan SEMUA ikon Ionicons di sini (cukup sekali, tidak perlu di main.ts)
addIcons(allIcons);
