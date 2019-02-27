import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AngularFireModule} from "@angular/fire";
import {AngularFireAuthModule} from "@angular/fire/auth";
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {environment} from '../environments/environment';
import {MusicQuizComponent} from './components/music-quiz/music-quiz.component';
import {SignInComponent} from './components/sign-in/sign-in.component';
import {AuthService} from "./services/auth.service";
import {FlexLayoutModule} from "@angular/flex-layout";
import {MatButtonModule, MatIconModule, MatMenuModule, MatToolbarModule} from "@angular/material";

@NgModule({
  declarations: [
    AppComponent,
    MusicQuizComponent,
    SignInComponent
  ],
  imports: [
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    FlexLayoutModule,
    BrowserModule,
    AppRoutingModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule
  ],
  providers: [AuthService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
