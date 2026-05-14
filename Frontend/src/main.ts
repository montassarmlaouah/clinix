import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { routes } from './app/app.routes';
import { tokenInterceptor } from './app/interceptor/token-interceptor';

bootstrapApplication(App, {
  providers: [
    provideHttpClient(
      withInterceptors([tokenInterceptor]) ), 
    importProvidersFrom(
      BrowserModule,
      ReactiveFormsModule,
      RouterModule.forRoot(routes) // ajout important
    )
  ]
}).catch(err => console.error(err));