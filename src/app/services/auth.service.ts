import {Injectable, NgZone} from '@angular/core';
import {User} from "./user";
import {auth} from 'firebase/app';
import {AngularFireAuth} from "@angular/fire/auth";
import {AngularFirestore, AngularFirestoreDocument} from '@angular/fire/firestore';
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  userData: any;

  constructor(
    public afs: AngularFirestore,
    public afAuth: AngularFireAuth,
    public router: Router,
    public ngZone: NgZone
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

  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider());
  }

  AuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider)
      .then((result) => {
          if (result.user.email.endsWith('@uniqode.se')) {
            this.ngZone.run(() => {
              this.router.navigate(['music-quiz']);
            });
            this.SetUserData(result.user);
          } else {
            this.SignOut();
          }
        }
      ).catch((error) => {
        window.alert(error)
      })
  }

  SetUserData(user) {
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

  // Sign out
  SignOut() {
    return this.afAuth.auth.signOut().then(() => {
      localStorage.removeItem('user');
      this.ngZone.run(() => {
        this.router.navigate(['sign-in']);
      })
    })
  }

}
