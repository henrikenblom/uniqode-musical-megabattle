import * as admin from "firebase-admin";
import {AutoSwitch, MinimalTrack, MusicQuizGuess, PlayerStats, QuizState, Track} from "./declarations";

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
    const opinionRef = db.collection('musicquiz').doc('current_opinion');
    const autoSwitchRef = db.collection('musicquiz').doc('auto_switch');

    if (newTrack.name !== previousTrack.name
      || newTrack.artist_id !== previousTrack.artist_id) {

      db.collection('musicquiz').doc('start_track').get().then(snapshot => {
        if (snapshot.exists) {
          const startTrack = snapshot.data() as MinimalTrack;
          if (startTrack.track_id === newTrack.track_id) {
            db.collection('general').doc('state').set({musicQuizRunning: true})
              .then(() => {
                console.log('Quiz start was triggered by track');
                setStatusMessage('Quiz was started by trigger track');
              })
              .catch(() => {
                console.error('An error occurred trying to auto start quiz');
              });
          }
        }
      }).catch(() => {
        console.error('An error occurred trying to fetch start track');
      });

      db.collection('musicquiz').doc('stop_track').get().then(snapshot => {
        if (snapshot.exists) {
          const stopTrack = snapshot.data() as MinimalTrack;
          if (stopTrack.track_id === newTrack.track_id) {
            db.collection('general').doc('state').set({musicQuizRunning: false})
              .then(() => {
                console.log('Quiz stop was triggered by track');
                setStatusMessage('Quiz was stopped by trigger track');
              })
              .catch(() => {
                console.error('An error occurred trying to auto stop quiz');
              });
          }
        }
      }).catch(() => {
        console.error('An error occurred trying to fetch stop track');
      });

      const usersReference = db.collection('musicquiz').doc('guesses').collection('users');
      const query = usersReference.orderBy('__name__');

      opinionRef.set({
        negative_count: 0,
        positive_count: 0
      }).then(() => {
        console.log('Reset opinion')
      }).catch(err => {
        console.error('An error occurred trying to reset opinion: ', err);
      });

      autoSwitchRef.update({
        suppress_next_switch: false
      }).then(() => {
        console.log('Set autoswitch suppression to false');
      }).catch(err => {
        console.error('An error occurred trying to reset opinion: ', err);
      });

      return query.get()
        .then((snapshot) => {

          const batch = db.batch();
          snapshot.docs.forEach((doc) => {
            batch.set(doc.ref, {haveGuessed: false, guessWasCorrect: false});
          });

          batch.commit().catch(e => {
            console.error(e);
          })
          setStatusMessage('');
        });

    } else {
      return change;
    }

  });

exports.musicQuizAutoSwitch = functions.firestore
  .document('musicquiz/current_track')
  .onUpdate((change: { after: { data: () => Track; }; before: { data: () => Track; }; }) => {

    const reward = change.after.data().reward;
    const previousReward = change.before.data().reward;
    const isPlaying = change.after.data().is_playing;

    if (isPlaying
      && reward != previousReward) {
      db.collection('musicquiz').doc('auto_switch').get().then(asSnapshot => {
        if (asSnapshot.exists) {
          const autoSwitch = asSnapshot.data() as AutoSwitch;
          if (autoSwitch.active
            && !autoSwitch.suppress_next_switch
            && reward <= (10 - autoSwitch.progress_threshold)) {
            db.collection('users').get().then(usersSnapshot => {
              const userCount = usersSnapshot.size - 1; // Deduct admin account
              if (userCount > 0) {
                db.collection('musicquiz')
                  .doc('guesses')
                  .collection('users').get().then(statesSnapshot => {
                  let guessCount = 0;
                  statesSnapshot.forEach(stateSnapshot => {
                    const state = stateSnapshot.data() as QuizState;
                    if (state.haveGuessed) {
                      guessCount++;
                    }
                  });
                  const guessPercentage = (guessCount / userCount) * 100;
                  if (guessPercentage >= autoSwitch.response_threshold) {
                    db.collection('musicquiz')
                      .doc('auto_switch_trigger')
                      .set({switch: true}).then(() => {
                      console.log('Auto switch trigger set due to response threshold exceeded');
                      setStatusMessage('Auto skip was triggered by response/progress thresholds');
                    }).catch(err => {
                      console.log(err);
                    });
                    return true;
                  } else {
                    return false;
                  }
                }).catch(err => {
                  console.log(err);
                });
                return true;
              } else {
                return false;
              }
            }).catch(err => {
              console.log(err);
            });
          }
          return true;
        } else {
          return false;
        }
      }).catch(err => {
        console.log(err);
      });
    } else {
      return false;
    }
    return false;
  });

exports.musizQuizHandleGuess = functions.firestore
  .document('musicquiz/guesses/users/{userId}')
  .onUpdate((change: { after: { data: () => QuizState; }, before: { data: () => QuizState; } }, context: { params: { userId: string; }; }) => {

    const guessState = change.after.data();
    const userId = context.params.userId;
    const historyRef = db.collection('musicquiz').doc('history').collection(userId);
    const statsRef = db.collection('musicquiz').doc('scoreboard').collection('stats').doc(userId);
    const opinionRef = db.collection('musicquiz').doc('current_opinion');
    const autoSwitchRef = db.collection('musicquiz').doc('auto_switch');
    let reward = 0;

    if (change.before.data().feedback !== change.after.data().feedback) {
      db.collection('users').get().then(usersSnapshot => {
        const userCount = usersSnapshot.size - 1; // Deduct admin account
        if (userCount > 0) {
          const feedback = change.after.data().feedback;
          opinionRef.get().then(opinionSnapshot => {
            autoSwitchRef.get().then(autoSwitchSnapshot => {
              const autoSwitch = autoSwitchSnapshot.data() as AutoSwitch;
              if (autoSwitch.opinion_threshold > 0) {
                const opinion = opinionSnapshot.data() as {
                  negative_count: number,
                  positive_count: number
                };
                if (feedback < 0) {
                  opinion.negative_count++;
                  const negativeQuota = (opinion.negative_count / userCount) * 100;
                  if (negativeQuota >= autoSwitch.opinion_threshold) {
                    db.collection('musicquiz')
                      .doc('auto_switch_trigger')
                      .set({switch: true}).then(() => {
                      console.log('Auto switch trigger set due to negative feedback');
                      setStatusMessage('Auto skip was triggered due to negative feedback');
                    }).catch(err => {
                      console.log(err);
                    });
                  }
                }
                if (feedback > 0) {
                  opinion.positive_count++;
                  const positiveQuota = (opinion.positive_count / userCount) * 100;
                  if (positiveQuota >= autoSwitch.opinion_threshold) {
                    autoSwitch.suppress_next_switch = true;
                    autoSwitchRef.set(autoSwitch).then(() => {
                      console.log('Suppressed next auto switch due to positive feedback');
                      setStatusMessage('Suppressed next auto skip due to positive feedback');
                    }).catch(err => {
                      console.log(err);
                    });
                  }
                }
                opinionRef.set(opinion).then(() => {
                  console.log('Updated opinion data');
                }).catch(err => {
                  console.log(err);
                });
              }
            }).catch(err => {
              console.log(err);
            });
          }).catch(err => {
            console.log(err);
          });
        }
      }).catch(err => {
        console.log(err);
      });
    }

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

function setStatusMessage(message: string) {
  db.collection('general').doc('status_message').set({text: message}).then(() => {
    console.log('Set status message to', message);
  }).catch(err => {
    console.error(err);
  });
}
