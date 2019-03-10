import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AngularFireModule} from "@angular/fire";
import {AngularFireAuthModule} from "@angular/fire/auth";
import {AngularFirestoreModule, FirestoreSettingsToken} from '@angular/fire/firestore';
import {environment} from '../environments/environment';
import {MusicQuizComponent} from './components/music-quiz/music-quiz.component';
import {SignInComponent} from './components/sign-in/sign-in.component';
import {AuthService} from "./services/auth.service";
import {FlexLayoutModule} from "@angular/flex-layout";
import {
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatMenuModule,
  MatRippleModule, MatSnackBarModule,
  MatToolbarModule
} from "@angular/material";
import {BackgroundImageDirective} from './background-image.directive';
import {CountoModule} from "angular2-counto";
import {RoundPipe} from './round.pipe';
import {UseUniqodeAccountWarningComponent} from './use-uniqode-account-warning/use-uniqode-account-warning.component';

@NgModule({
  declarations: [
    AppComponent,
    MusicQuizComponent,
    SignInComponent,
    BackgroundImageDirective,
    RoundPipe,
    UseUniqodeAccountWarningComponent
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
    MatMenuModule,
    MatCardModule,
    MatRippleModule,
    MatSnackBarModule,
    CountoModule
  ],
  entryComponents: [UseUniqodeAccountWarningComponent],
  providers: [AuthService,
    {provide: FirestoreSettingsToken, useValue: {}},
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 4000}}],
  bootstrap: [AppComponent]
})
export class AppModule {
}
