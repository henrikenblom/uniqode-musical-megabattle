import * as admin from "firebase-admin";
import {GuessState, MusicQuizGuess, PlayerStats, Track} from "./declarations";

try {
  admin.initializeApp();
} catch (e) {
}

const functions = require('firebase-functions');
const db = admin.firestore();

exports.musicQuizResetGuesses = functions.firestore
  .document('musicquiz/current_track')
  .onUpdate((change: { after: { data: () => Track; }; before: { data: () => Track; }; }) => {

    const newTrack = change.after.data();
    const previousTrack = change.before.data();

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
      return change;
    }

  });

exports.musizQuizHandleGuess = functions.firestore
  .document('musicquiz/guesses/users/{userId}')
  .onUpdate((change: { after: { data: () => GuessState; }; }, context: { params: { userId: string; }; }) => {

    const guessState = change.after.data();
    const userId = context.params.userId;
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
      return change;
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
