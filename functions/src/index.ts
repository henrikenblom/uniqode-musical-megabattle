import * as admin from "firebase-admin";
import {QuizState, MusicQuizGuess, PlayerStats, Track} from "./declarations";

try {
  admin.initializeApp();
} catch (e) {
}

const functions = require('firebase-functions');
const db = admin.firestore();

exports.resetMusicQuiz = functions.https.onRequest((req: any, res: any) => {

  const scoreboardRef = db.collection('musicquiz').doc('scoreboard').collection('stats');
  const guessesRef = db.collection('musicquiz').doc('guesses').collection('users');

  const promise = scoreboardRef.get()
    .then((snapshot) => {

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      batch.commit().then(() => {
        console.log('Scoreboard has been reset.')
      }).catch(() => {
        console.error('Scoreboard could not be reset.');
      });

    });

  guessesRef.get()
    .then((snapshot) => {

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      batch.commit().then(() => {
        console.log('Guesses has been reset.')
      }).catch(() => {
        console.error('Guesses could not be reset.');
      });

    }).then(() => {
      console.log('Guesses snapshot could be fetched');
    })
    .catch(() => {
      console.log('Guesses snapshot could not be fetched');
    });

  res.set({'Access-Control-Allow-Origin': '*'}).status(200).send('OK');

  return promise;

});

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
  .onUpdate((change: { after: { data: () => QuizState; }, before: { data: () => QuizState; } }, context: { params: { userId: string; }; }) => {

    const guessState = change.after.data();
    const userId = context.params.userId;
    const historyRef = db.collection('musicquiz').doc('history').collection(userId);
    const statsRef = db.collection('musicquiz').doc('scoreboard').collection('stats').doc(userId);
    let reward = 0;

    if (!change.before.data().haveGuessed && guessState.guessWasCorrect) {

      let playerStats: PlayerStats = musicQuizIncreaseStats({
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
      }, guessState.reward, guessState.artistGenres);

      reward = guessState.reward;

      statsRef.get()
        .then(doc => {
          if (doc.exists) {
            playerStats = musicQuizIncreaseStats(<PlayerStats>doc.data(), guessState.reward, guessState.artistGenres);
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

    if (!change.before.data().haveGuessed && guessState.haveGuessed) {
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

function musicQuizIncreaseStats(playerStats: PlayerStats, reward: number, genres: String[]): PlayerStats {
  playerStats.points += reward;
  playerStats.responses++;
  if (reward === 10) {
    playerStats.tens++;
  }
  if (genres) {
    const genreString = genres.join(' ');
    if (genreString.includes('pop')) playerStats.pop_points++;
    if (genreString.includes('rock')) playerStats.rock_points++;
    if (genreString.includes('edm')) playerStats.edm_points++;
    if (genreString.includes('punk')) playerStats.punk_points++;
    if (genreString.includes('reggae')) playerStats.reggae_points++;
    if (genreString.includes('rap')) playerStats.rap_points++;
    if (genreString.includes('disco')) playerStats.disco_points++;
    if (genreString.includes('rnb')) playerStats.rnb_points++;
    if (genreString.includes('indie')) playerStats.indie_points++;
    if (genreString.includes('soul')) playerStats.soul_points++;
  }
  return playerStats;
}
