export interface Track {
  name: string;
  artist_name: string;
  artist_id: string;
  is_playing: boolean;
  reward: number;
  song_start?: Date;
}

export interface PlayerStats {
  points: number;
  tens: number;
  responses: number;
}

export class InitialPlayerStats implements PlayerStats {
  points = 0;
  tens = 0;
  responses = 0;
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
}

export interface ResponseOption {
  response: string;
  correct: boolean;
}

export interface ApplicationState {
  musicQuizRunning: boolean;
}
