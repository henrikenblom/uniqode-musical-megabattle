export interface Track {
  name: string;
  artist_name: string;
  artist_id: string;
  is_playing: boolean;
  reward: number;
  artist_count: number;
  song_start?: Date;
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

export interface GuessState {
  haveGuessed: boolean;
  guessWasCorrect: boolean;
  reward: number;
  artist_genres: String[];
}

export interface ResponseOption {
  response: string;
  correct: boolean;
}

export interface ApplicationState {
  musicQuizRunning: boolean;
}
