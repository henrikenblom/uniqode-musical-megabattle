import * as admin from "firebase-admin";
import {GuessState, MusicQuizGuess, PlayerStats, Track} from "./declarations";

try {
  admin.initializeApp();
} catch (e) {
}

const functions = require('firebase-functions');
const db = admin.firestore();
//TODO Both functions get Cannot read property 'data' of undefined
exports.musicQuizResetGuesses = functions.firestore
  .document('musicquiz/current_track')
  .onUpdate((event: { data: { data: () => Track; previous: { data: () => Track; }; }; }) => {

    const newTrack = event.data.data();
    const previousTrack = event.data.previous.data();

    if (newTrack.name !== previousTrack.name
      || newTrack.artist_id !== previousTrack.artist_id) {
      const reference = db.collection('musicquiz').doc('guesses').collection('users');
      const query = reference.orderBy('__name__');

      return query.get()
        .then((snapshot) => {

          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            batch.set(doc.ref, {haveGuessed: false, guessWasCorrect: false});
          });

          batch.commit().catch(e => {
            console.error(e);
          })

        });

    } else {
      return event;
    }

  });

exports.musizQuizHandleGuess = functions.firestore
  .document('musicquiz/guesses/users/{userId}')
  .onUpdate((event: { data: { data: () => GuessState; }; params: { userId: any; }; }) => {

    const guessState = event.data.data();
    const userId = event.params.userId;
    const historyRef = db.collection('musicquiz').doc('history').collection(userId);
    let reward = 0;

    if (guessState.guessWasCorrect) {

      let playerStats: PlayerStats = musicQuizAddReward({points: 0, responses: 0, tens: 0}, guessState.reward);
      const statsRef = db.collection('musicquiz').doc('scoreboard').collection('stats').doc(userId);
      reward = guessState.reward;

      statsRef.get()
        .then(doc => {
          if (doc.exists) {
            playerStats = musicQuizAddReward(<PlayerStats>doc.data(), guessState.reward);
            statsRef.update(playerStats).catch(e => {
              console.error(e);
            });
          } else {
            statsRef.set(playerStats).catch(e => {
              console.error(e);
            });
          }
        })
        .catch(err => {
          console.log(err);
        });

    }

    guessState.reward = reward;

    if (guessState.haveGuessed) {
      const guess: MusicQuizGuess = {
        guessDate: new Date(),
        guessWasCorrect: guessState.guessWasCorrect,
        reward: guessState.reward
      };
      return historyRef.add(guess);
    } else {
      return event;
    }

  });

function musicQuizAddReward(playerStats: PlayerStats, reward: number): PlayerStats {
  playerStats.points += reward;
  playerStats.responses++;
  if (reward === 10) {
    playerStats.tens++;
  }
  return playerStats;
}
