import {Component, OnInit, NgZone} from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {AngularFirestore} from "@angular/fire/firestore";
import {ApplicationState, QuizState, PlayerStats, ResponseOption, Track} from "../../../../functions/src/declarations";
import {animate, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-music-quiz',
  templateUrl: './music-quiz.component.html',
  styleUrls: ['./music-quiz.component.scss'],
  animations: [
    trigger('delayed-fold', [
      transition(':enter', [style({height: 0, opacity: 0, overflow: 'hidden'}),
        animate('.3s 1.5s ease',
          style({height: '*', opacity: '*'}))]),
      transition(':leave', [style({height: '*', opacity: '*', overflow: 'hidden'}),
        animate('.3s .2s ease',
          style({height: 0, opacity: 0}))])
    ]),
    trigger('fold', [
      transition(':enter', [style({height: 0, opacity: 0, overflow: 'hidden'}),
        animate('.2s .2s ease',
          style({height: '*', opacity: '*'}))]),
      transition(':leave', [style({height: '*', opacity: '*', overflow: 'hidden'}),
        animate('.2s ease',
          style({height: 0, opacity: 0}))])
    ]),
    trigger('fold-out', [
      transition(':enter', [style({height: 0, opacity: 0, overflow: 'hidden'}),
        animate('.2s ease',
          style({height: '*', opacity: '*'}))])
    ])
  ]
})
export class MusicQuizComponent implements OnInit {

  REWARD_ADJUSTMENT_SCALE = 0.2303;
  MAX_RANDOM_IMAGE_INDEX = 16;
  currentTrack: Track;
  currentArtistInformation: ArtistInformation;
  playerStats: PlayerStats;
  responseOptions: ResponseOption[];
  generalStateQuizRunning = false;
  quizRunning = false;
  quizState: QuizState = {guessWasCorrect: false, haveGuessed: false, reward: 0, artistGenres: [], haveLiked: false};
  stateSynced = false;
  guessable = true;
  randomImageIndex = 1;
  previousScore = 0;

  constructor(
    private db: AngularFirestore,
    public authService: AuthService,
    public router: Router,
    public ngZone: NgZone
  ) {
  }

  ngOnInit() {
    this.authService.afAuth.authState.subscribe(user => {
      if (user) {
        this.initializeState();
        this.fetchGeneralState();
        this.fetchCurrentTrack();
      }
    });
  }

  onCountoEnd() {
    this.previousScore = this.playerStats.points;
  }

  likeTrack(positive: boolean) {
    if (!this.quizState.haveLiked) {
      this.quizState.haveLiked = true;
      const statsReference = this.db.collection('musicquiz')
        .doc('scoreboard')
        .collection('stats')
        .doc(this.authService.userData.uid);
      const term = positive ? 1 : -1;
      statsReference.ref.get()
        .then(doc => {
          let playerStats = <PlayerStats>doc.data();
          const genreString = this.currentArtistInformation.genres.join(' ');
          if (genreString.includes('pop')) playerStats.pop_likes += term;
          if (genreString.includes('rock')) playerStats.rock_likes += term;
          if (genreString.includes('edm')) playerStats.edm_likes += term;
          if (genreString.includes('punk')) playerStats.punk_likes += term;
          if (genreString.includes('reggae')) playerStats.reggae_likes += term;
          if (genreString.includes('rap')) playerStats.rap_likes += term;
          if (genreString.includes('disco')) playerStats.disco_likes += term;
          if (genreString.includes('rnb')) playerStats.rnb_likes += term;
          if (genreString.includes('indie')) playerStats.indie_likes += term;
          if (genreString.includes('soul')) playerStats.soul_likes += term;
          statsReference.set(playerStats).then(() =>
            this.persistState()
          );
        });
    }
  }

  guess(responseOption: ResponseOption) {
    this.quizState = {
      guessWasCorrect: responseOption.correct,
      haveGuessed: true,
      reward: this.adjustReward(this.currentTrack.reward),
      artistGenres: this.currentArtistInformation.genres,
      haveLiked: false
    };
    this.responseOptions = [];
    this.persistState();
  }

  private persistState() {
    this.db.collection('musicquiz')
      .doc('guesses')
      .collection('users')
      .doc(this.authService.userData.uid)
      .set(this.quizState);
  }

  adjustReward(reward: number) {
    return Math.floor(Math.exp(reward * this.REWARD_ADJUSTMENT_SCALE));
  }

  private initializeState() {
    const stateReference = this.db.collection('musicquiz')
      .doc('guesses')
      .collection('users')
      .doc(this.authService.userData.uid);
    const statsReference = this.db.collection('musicquiz')
      .doc('scoreboard')
      .collection('stats')
      .doc(this.authService.userData.uid);

    stateReference.ref.get()
      .then(doc => {
        if (doc.exists) {
          this.quizState = <QuizState>doc.data();
        } else {
          stateReference.set(this.quizState);
        }
      }).then(() => this.fetchState());

    statsReference.ref.get()
      .then(doc => {
        if (!doc.exists) {
          statsReference.set({
            disco_likes: 0,
            disco_points: 0,
            edm_likes: 0,
            edm_points: 0,
            indie_likes: 0,
            indie_points: 0,
            points: 0,
            pop_likes: 0,
            pop_points: 0,
            punk_likes: 0,
            punk_points: 0,
            rap_likes: 0,
            rap_points: 0,
            reggae_likes: 0,
            reggae_points: 0,
            responses: 0,
            rnb_likes: 0,
            rnb_points: 0,
            rock_likes: 0,
            rock_points: 0,
            soul_likes: 0,
            soul_points: 0,
            tens: 0,
          });
        }
      }).then(() => this.fetchPlayerStats());

  }

  private fetchPlayerStats() {
    this.db.collection('musicquiz')
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
      .doc<QuizState>(this.authService.userData.uid)
      .valueChanges()
      .forEach(state => {
        this.quizState = state;
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
        this.randomImageIndex = MusicQuizComponent.randomizeIndex(this.MAX_RANDOM_IMAGE_INDEX);
        if (update) {
          this.guessable = true;
          this.quizState.haveGuessed = false;
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
        if (artistInformation) {
          this.responseOptions = [];
          this.currentArtistInformation = artistInformation;
          this.responseOptions[0] = {response: artistInformation.name, correct: true};
          this.responseOptions[1] = {response: artistInformation.related_artists[0], correct: false};
          this.responseOptions[2] = {response: artistInformation.related_artists[1], correct: false};
          MusicQuizComponent.shuffleResponses(this.responseOptions);
          this.guessable = true;
        } else {
          this.responseOptions = [];
          this.guessable = false;
        }
      });
  }

  private static shuffleResponses(array: ResponseOption[]): ResponseOption[] {
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

  private static randomizeIndex(maxIndex: number) {
    return Math.floor(Math.random() * (maxIndex - 1 + 1)) + 1;
  }

}
