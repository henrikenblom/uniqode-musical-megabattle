import {Injectable, NgZone} from '@angular/core';
import {auth} from 'firebase/app';
import {AngularFireAuth} from "@angular/fire/auth";
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material";
import {UseUniqodeAccountWarningComponent} from "../use-uniqode-account-warning/use-uniqode-account-warning.component";
import {User} from "../../../functions/src/declarations";

@Injectable({
  providedIn: 'root'
})

export class AuthService {

  userData: User;

  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    public router: Router,
    public ngZone: NgZone,
    private snackBar: MatSnackBar
  ) {
    this.afAuth.authState.subscribe(user => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        JSON.parse(localStorage.getItem('user'));
      } else {
        localStorage.setItem('user', null);
        JSON.parse(localStorage.getItem('user'));
      }
    })
  }

  static get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null);
  }

  googleAuth() {
    return this.authLogin(new auth.GoogleAuthProvider());
  }

  authLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((result) => {
          if (result.user.email.includes('@')) {
            this.ngZone.run(() => {
              this.router.navigate(['music-quiz']);
            });
            this.setUserData(result.user);
          } else {
            this.signOut();
            this.snackBar.openFromComponent(UseUniqodeAccountWarningComponent);
          }
        }
      ).catch((error) => {
        window.alert(error)
      })
  }

  setUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
    return userRef.set(userData, {
      merge: true
    })
  }

  signOut() {
    return this.afAuth.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.ngZone.run(() => {
        this.router.navigate(['sign-in']);
      })
    })
  }

}
