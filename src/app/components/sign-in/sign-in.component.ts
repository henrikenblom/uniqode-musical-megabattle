import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {AngularFirestore} from "@angular/fire/firestore";
import {User} from "../../../../functions/src/declarations";

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  animations: [
    trigger('simpleFadeAnimation', [

      state('in', style({opacity: 1})),

      transition(':enter', [
        style({opacity: 0}),
        animate(600)
      ]),

      transition(':leave',
        animate(600, style({opacity: 0})))
    ])
  ]
})
export class SignInComponent implements OnInit {

  preLogin = false;
  userList: User[];

  constructor(public authService: AuthService,
              private db: AngularFirestore) {
  }

  ngOnInit() {
    this.startFetchingUsers();
    setTimeout(() => {
      this.preLogin = false;
    }, 5000);
  }

  startFetchingUsers() {
    this.db.collection<User>('users')
      .valueChanges()
      .forEach(u => {
        this.userList = u;
      });
  }

}
