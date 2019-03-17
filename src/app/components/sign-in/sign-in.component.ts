import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {animate, state, style, transition, trigger} from "@angular/animations";

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

  constructor(public authService: AuthService) {
  }

  ngOnInit() {
    setTimeout(() => {
      this.preLogin = false;
    }, 5000);
  }

}
