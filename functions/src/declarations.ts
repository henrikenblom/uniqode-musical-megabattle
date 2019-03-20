export interface Track {
  name: string;
  artist_name: string;
  artist_id: string;
  is_playing: boolean;
  reward: number;
  artist_count: number;
  timestamp: number;
  duration: number;
  track_id: string;
}

export interface MinimalTrack {
  name: string;
  artist_name: string;
  track_id: string;
}

export interface CustomQuestion {
  trackName: string;
  artistName: string;
  trackId: string;
  text: string;
  responseOptions: ResponseOption[];
}

export interface PlayerStats {
  points: number;
  tens: number;
  responses: number;
  pop_points: number;
  rock_points: number;
  edm_points: number;
  punk_points: number;
  reggae_points: number;
  rap_points: number;
  disco_points: number;
  rnb_points: number;
  indie_points: number;
  soul_points: number;
  pop_likes: number;
  rock_likes: number;
  edm_likes: number;
  punk_likes: number;
  reggae_likes: number;
  rap_likes: number;
  disco_likes: number;
  rnb_likes: number;
  indie_likes: number;
  soul_likes: number;
}

export interface MusicQuizGuess {
  guessWasCorrect: boolean;
  reward: number;
  guessDate: Date;
}

export interface QuizState {
  haveGuessed: boolean;
  guessWasCorrect: boolean;
  reward: number;
  artistGenres: string[];
  haveLiked: boolean;
  feedback: number;
}

export interface ResponseOption {
  response: string;
  correct: boolean;
}

export interface ApplicationState {
  musicQuizRunning: boolean;
}


export interface AutoSwitch {
  active: boolean;
  threshold: number;
}
