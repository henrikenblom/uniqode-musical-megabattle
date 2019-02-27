import {Component, OnInit, NgZone} from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {AngularFirestore} from "@angular/fire/firestore";
import {ApplicationState, GuessState, PlayerStats, ResponseOption, Track} from "../../../../functions/src/declarations";

@Component({
  selector: 'app-music-quiz',
  templateUrl: './music-quiz.component.html',
  styleUrls: ['./music-quiz.component.scss']
})
export class MusicQuizComponent implements OnInit {

  REWARD_ADJUSTMENT_SCALE = 0.2303;
  currentTrack: Track;
  currentArtistInformation: ArtistInformation;
  playerStats: PlayerStats;
  responseOptions: ResponseOption[];
  generalStateQuizRunning = false;
  quizRunning = false;
  guessState: GuessState = {guessWasCorrect: false, haveGuessed: false, reward: 0};
  stateSynced = false;
  guessable = true;

  constructor(
    private db: AngularFirestore,
    public authService: AuthService,
    public router: Router,
    public ngZone: NgZone
  ) {}

  ngOnInit() {
    this.authService.afAuth.authState.subscribe(user => {
      if (user) {
        this.initializeState();
        this.fetchGeneralState();
        this.fetchCurrentTrack();
      }
    });
  }

  guess(responseOption: ResponseOption) {
    this.guessState = {
      guessWasCorrect: responseOption.correct,
      haveGuessed: true,
      reward: this.adjustReward(this.currentTrack.reward)
    };
    this.responseOptions = [];
    this.db.collection('musicquiz')
      .doc('guesses')
      .collection('users')
      .doc(this.authService.userData.uid)
      .set(this.guessState);
  }

  adjustReward(reward: number) {
    return Math.floor(Math.exp(reward * this.REWARD_ADJUSTMENT_SCALE));
  }

  private initializeState() {
    const docReference = this.db.collection('musicquiz')
      .doc('guesses')
      .collection('users')
      .doc(this.authService.userData.uid);
    const statsReference = this.db.collection('musicquiz')
      .doc('scoreboard')
      .collection('stats')
      .doc(this.authService.userData.uid);

    docReference.ref.get()
      .then(doc => {
        this.guessState.haveGuessed = doc.exists;
        if (doc.exists) {
          this.guessState.guessWasCorrect = doc.data()['correct'];
        } else {
          docReference.set(this.guessState);
        }
      }).then(() => this.fetchState());

    statsReference.ref.get()
      .then(doc => {
        if (!doc.exists) {
          docReference.set({points: 0, responses: 0, tens: 0});
        }
      }).then(() => this.fetchPlayerStats());

  }

  private fetchPlayerStats() {
    const statsReference = this.db.collection('musicquiz')
      .doc('scoreboard')
      .collection('stats')
      .doc<PlayerStats>(this.authService.userData.uid)
      .valueChanges()
      .forEach(stats => {
        this.playerStats = stats;
      });
  }

  private fetchState() {
    this.db.collection('musicquiz')
      .doc('guesses')
      .collection('users')
      .doc<GuessState>(this.authService.userData.uid)
      .valueChanges()
      .forEach(guessState => {
        if (guessState !== null) {
          this.guessState.haveGuessed = guessState.haveGuessed;
          this.guessState.guessWasCorrect = guessState.guessWasCorrect;
        }
        this.stateSynced = true;
      });
  }

  private fetchGeneralState() {
    this.db.collection('general')
      .doc<ApplicationState>('state')
      .valueChanges()
      .forEach(state => {
        this.generalStateQuizRunning = state.musicQuizRunning;
      });
  }

  private fetchCurrentTrack() {
    this.db.collection('musicquiz')
      .doc<Track>('current_track')
      .valueChanges()
      .forEach(track => {
        const update = this.currentTrack === undefined
          || (this.currentTrack.name !== track.name
            || this.currentTrack.artist_id !== track.artist_id);
        this.currentTrack = track;
        this.quizRunning = this.currentTrack.is_playing;
        if (update) {
          this.guessable = true;
          this.guessState.haveGuessed = false;
          this.fetchCurrentArtistInformation();
        }
      });
  }

  private fetchCurrentArtistInformation() {
    this.db.collection('musicquiz')
      .doc('artists')
      .collection('played')
      .doc<ArtistInformation>(this.currentTrack.artist_id)
      .valueChanges()
      .forEach(artistInformation => {
        if (artistInformation !== null) {
          this.responseOptions = [];
          this.currentArtistInformation = artistInformation;
          this.responseOptions[0] = {response: artistInformation.name, correct: true};
          this.responseOptions[1] = {response: artistInformation.related_artists[0], correct: false};
          this.responseOptions[2] = {response: artistInformation.related_artists[1], correct: false};
          this.shuffleResponses(this.responseOptions);
          this.guessable = true;
        } else {
          this.responseOptions = [];
          this.guessable = false;
        }
      });
  }

  private shuffleResponses(array: ResponseOption[]): ResponseOption[] {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

}
