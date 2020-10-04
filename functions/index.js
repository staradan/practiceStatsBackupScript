const cors = require('cors')({ origin: true });
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();
const admin = require('firebase-admin');
admin.initializeApp();
const bucket = 'gs://practicestatsbackup';
let db;
async function getFirestore() {
  db = await admin.firestore();
}
getFirestore();

/**
 * Daily Database Backup
 */
exports.scheduledFirestoreExport = functions.pubsub
  .schedule('every 24 hours')
  .onRun((context) => {

    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName =
      client.databasePath(projectId, '(default)');

    return client.exportDocuments({
      name: databaseName,
      outputUriPrefix: bucket,
      // Leave collectionIds empty to export all collections
      // or set to a list of collection IDs to export,
      // collectionIds: ['users', 'posts']
      collectionIds: []
    })
      .then(responses => {
        const response = responses[0];
        console.log(`Operation Name: ${response['name']}`);
      })
      .catch(err => {
        console.error(err);
        throw new Error('Export operation failed');
      });
  });

/**
 * Delete stat with ID
 */
exports.deleteStatByID = functions.https.onRequest((req, res) => {
  const ID = req.query.statID;
  console.log('wubba lubba dub dub', parseFloat(605.578884363013));

  db.collection("allStats")
    .where("statID", "==", parseFloat(ID))
    .get().then(snapshot => {
      console.log('poop');
      snapshot.forEach(doc => {
        doc.ref.delete();
      });
      res.send('deleted!');
      return "";
    }).catch(reason => {
      res.send(reason)
    });
});

/**
 * Delete Stats Within Time Period
 */
exports.deleteStatsInPeriod = functions.https.onRequest((req, res) => {
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);

  db.collection("allStats")
    .where('createdAt', '>', startDate)
    .where('createdAt', '<', endDate)
    .get().then(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.delete();
      });
      res.send('deleted');
      return "";
    }).catch(reason => {
      res.send(reason)
    });
});


/**
 * Get all of the stats for a player
 */
exports.getAllStatsForPlayer = functions.https.onRequest((req, res) => {
  var stats = [];
  db.collection("allStats").where("playerName", "==", req.query.playerName).get().then(snapshot => {
    snapshot.forEach(doc => {
      var newelement = {
        "id": doc.id,
        "createdAt": doc.data().createdAt,
        "isPositive": doc.data().isPositive,
        "playerName": doc.data().playerName,
        "statID": doc.data().statID,
        "statName": doc.data().statName,
      }
      stats = stats.concat(newelement);
    });
    res.send(stats)
    return "";
  }).catch(reason => {
    res.send(reason)
  })
});


/**
 * Team stats in time period
 */
exports.getStatsInPeriod = functions.https.onRequest((req, res) => {
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);
  var stats = [];
  db.collection("allStats")
    .where('createdAt', '>', startDate)
    .where('createdAt', '<', endDate)
    .get().then(snapshot => {
      snapshot.forEach(doc => {
        var newelement = {
          "id": doc.id,
          "createdAt": doc.data().createdAt,
          "isPositive": doc.data().isPositive,
          "playerName": doc.data().playerName,
          "statID": doc.data().statID,
          "statName": doc.data().statName,
        }
        stats = stats.concat(newelement);
      });
      res.send(stats)
      return "";
    }).catch(reason => {
      res.send(reason)
    })
});

/**
 * Team Stats for Day
 */
exports.getStatsInDay = functions.https.onRequest((req, res) => {
  const startDate = firebase.getTimeStamp(new Date(req.query.day));
  const endDate = firebase.getTimeStamp(new Date(startDate.getTime() + (24 * 60 * 60 * 1000)));
  var stats = [];
  db.collection("allStats")
    .where(`created.${seconds}`, '>', startDate.seconds)
    .where(`createdAt.${seconds}`, '<', endDate.seconds)
    .get().then(snapshot => {
      snapshot.forEach(doc => {
        var newelement = {
          "id": doc.id,
          "createdAt": doc.data().createdAt,
          "isPositive": doc.data().isPositive,
          "playerName": doc.data().playerName,
          "statID": doc.data().statID,
          "statName": doc.data().statName,
        }
        stats = stats.concat(newelement);
      });
      res.send(stats)
      return "";
    }).catch(reason => {
      res.send(reason)
    })
});

exports.callAllPlayers = functions.https.onCall((data, context) => {
  var players = [];

  return db.collection('players')
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(doc => {
        var newelement = {
          "playerName": doc.data().playerName,
          "playerID": doc.data().playerID,
          "teamID": doc.data().teamID,
        }
        players = players.concat(newelement);
      });
      return players;
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });
});


goal = {
  player1Name: {
    positiveStats: [],
    negativeStats: [],
  },

  player2Name: {
    positiveStats: [],
    negativeStats: [],
  }
}



// exports.callBetterStatsInPeriod = functions.https.onCall((data, context) => {
//   const startDate = new Date(data.startDate);
//   const endDate = new Date(data.endDate);
//   //example has fields for types, and names
//   let categorizedStats = {};

//   return db.collection('allStats')
//     .where('createdAt', '>', startDate)
//     .where('createdAt', '<', endDate)
//     .get()
//     .then(function (querySnapshot) {
//       querySnapshot.forEach(doc => {
//         var newelement = {
//           "id": doc.id,
//           "createdAt": doc.data().createdAt,
//           "isPositive": doc.data().isPositive,
//           "playerName": doc.data().playerName,
//           "statID": doc.data().statID,
//           "statName": doc.data().statName,
//         }

//         if (doc.data().isPositive) { //stat is positive
//           //add it to the postive part
//           return ['poop!'];
//           // categorizedStats.allStats.isPositive = [];
//           // categorizedStats.allStats.isPositive.push(newelement);
//           // //add it to the player
//           // categorizedStats[doc.data().playerName].isPositive = [];
//           // categorizedStats[doc.data().playerName].isPositive.push(newelement);
//           // //add it to the category
//           // categorizedStats[doc.data().statName].isPositive = [];
//           // categorizedStats[doc.data().statName].isPositive.push(newelement);
//         } else { //stat is negative
//           return ['false!'];
//           //add it to the postive part
//           // categorizedStats.allStats.isNegative = [];
//           // categorizedStats.allStats.isNegative.push(newelement);
//           // //add it to the player
//           // categorizedStats[doc.data().playerName].isNegative = [];
//           // categorizedStats[doc.data().playerName].isNegative.push(newelement);
//           // //add it to the category
//           // categorizedStats[doc.data().statName].isNegative = [];
//           // categorizedStats[doc.data().statName].isNegative.push(newelement);
//         }
//       });
//       return categorizedStats;
//     })
//     .catch(function (error) {
//       console.error("Error adding document: ", error);
//     })

// });

exports.callBetterStatsInPeriod = functions.https.onCall((data, context) => {
  var stats = {
    allPositiveStats: [],
    allNegativeStats: [],
  };
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  result = {
    allPositiveStats: [],
    allNegativeStats: [],
    playerOne: {
      name: '',
      positives: [],
      negatives: []
    },
    playerTwo: {
      name: '',
      positives: [],
      negatives: []
    }
  }

  return db.collection('allStats')
    .where('createdAt', '>', startDate)
    .where('createdAt', '<', endDate)
    .get()
    .then(function (querySnapshot) {
      let playerName = doc.data().playerName;
      let playerID = doc.data().playerName;
      querySnapshot.forEach(doc => {
        var newelement = {
          "id": doc.id,
          "createdAt": doc.data().createdAt,
          "isPositive": doc.data().isPositive,
          "playerName": playerName,
          "statID": doc.data().statID,
          "statName": doc.data().statName,
        }
        if (doc.data().isPositive) {
          stats.allPositiveStats.push(newelement);

          if (stats.hasOwnProperty(playerID)) {
            stats[`${playerID}`].positiveStats.push(newelement);
          } else { // if it doesn't exist
            stats[`${playerID}`] = {
              name: playerName,
              positiveStats: [newelement],
              negativeStats: [],
            }
          }
        } else {
          stats.allNegativeStats.push(newelement);

          if (stats.hasOwnProperty(playerID)) {
            stats[`${playerID}`].negativeStats.push(newelement);
          } else { // if it doesn't exist
            stats[`${playerID}`] = {
              name: playerName,
              positiveStats: [],
              negativeStats: [newelement],
            }
          }
        }

        // if (doc.data().isPositive) { //stat is positive
        //   //add it to the postive part
        //   return ['poop!'];
        //   // categorizedStats.allStats.isPositive = [];
        //   // categorizedStats.allStats.isPositive.push(newelement);
        //   // //add it to the player
        //   // categorizedStats[doc.data().playerName].isPositive = [];
        //   // categorizedStats[doc.data().playerName].isPositive.push(newelement);
        //   // //add it to the category
        //   // categorizedStats[doc.data().statName].isPositive = [];
        //   // categorizedStats[doc.data().statName].isPositive.push(newelement);
        // } else { //stat is negative
        //   return ['false!'];
        //   //add it to the postive part
        //   // categorizedStats.allStats.isNegative = [];
        //   // categorizedStats.allStats.isNegative.push(newelement);
        //   // //add it to the player
        //   // categorizedStats[doc.data().playerName].isNegative = [];
        //   // categorizedStats[doc.data().playerName].isNegative.push(newelement);
        //   // //add it to the category
        //   // categorizedStats[doc.data().statName].isNegative = [];
        //   // categorizedStats[doc.data().statName].isNegative.push(newelement);
        // }

        //stats = stats.concat(newelement);
      });
      return stats;
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });
});

exports.callAllStatsForPlayer = functions.https.onCall((data, context) => {
  var stats = [];
  const playerName = data.playerName;
  //example has fields for types, and names
  return db.collection('allStats').where('playerName', '==', playerName).get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(doc => {
        var newelement = {
          "id": doc.id,
          "createdAt": doc.data().createdAt,
          "isPositive": doc.data().isPositive,
          "playerName": doc.data().playerName,
          "statID": doc.data().statID,
          "statName": doc.data().statName,
        }
        stats = stats.concat(newelement);
      });
      return stats;
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    })

});

//make an onrequest so we can test this baby out!


exports.newGetStatsInPeriod = functions.https.onCall(async (data, context) => {
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  let names = [];
  catObj = {};
  let stats = {
    Overall: {
      positive: [],
      negative: [],
      allStats: [],
      adjustedNegative: [],
      successPercent: -1,
    } //negative stats that do not count against the player/team in efficiency calculations
  };

  try {
    let namesQuery = await db.collection('names').get();
    let statsQuery = await db.collection('allStats').where('createdAt', '>', startDate).where('createdAt', '<', endDate).get();

    await namesQuery.forEach((doc) => {
      names.push(doc.data().names);
    });

    await names[0].map((playerName, index) => {
      stats[playerName] = {
        positive: [],
        negative: [],
        allStats: [],
        adjustedNegative: [],
        successPercent: -1,
      };
    });

    await statsQuery.forEach((doc) => {
      let x = doc.data();
      stats[x.playerName].allStats.push(x);
      stats.Overall.allStats.push(x);
      if (x.isPositive) {
        stats.Overall.positive.push(x);
        stats[x.playerName].positive.push(x);
      } else {
        stats.Overall.negative.push(x);
        stats[x.playerName].negative.push(x);
        if (x.statName !== 'Competitive' && x.statName !== 'Diving') {
          stats.Overall.adjustedNegative.push(x);
          stats[x.playerName].adjustedNegative.push(x);
        }
      }
    });

    for (const property in stats) {
      stats[property].successPercent =
        (stats[property].positive.length / (stats[property].positive.length + stats[property].adjustedNegative.length)).toFixed(2);
    }

    // res.send({ data: stats });
    return stats;
  } catch (err) {
    // console.error("Error adding document: ", err);
    // res.status(500).send(err.message);
    return err;
  }
});


exports.dudeGetStatsInPeriod = functions.https.onRequest(async (req, res) => {
  const startDate = new Date(req.body.data.startDate);
  const endDate = new Date(req.body.data.endDate);
  let names = [];
  catObj = {};
  let stats = {
    allPositive: [],
    allNegative: [],
    adjustedNegative: [], //negative stats that do not count against the player/team in efficiency calculations
  };

  try {
    let namesQuery = await db.collection('names').get();
    let statsQuery = await db.collection('allStats').where('createdAt', '>', startDate).where('createdAt', '<', endDate).get();

    await namesQuery.forEach((doc) => {
      names.push(doc.data().names);
    });

    await names[0].map((playerName, index) => {
      stats[playerName] = {
        positive: [],
        negative: [],
        allStats: [],
        adjustedNegative: [],
        successPercent: -1,
      };
    });

    await statsQuery.forEach((doc) => {
      let x = doc.data();
      stats[x.playerName].allStats.push(x);
      if (x.isPositive) {
        stats.allPositive.push(x);
        stats[x.playerName].positive.push(x);
      } else {
        stats.allNegative.push(x);
        stats[x.playerName].negative.push(x);
        if (x.statName !== 'Competitive' && x.statName !== 'Diving') {
          stats.adjustedNegative.push(x);
          stats[x.playerName].adjustedNegative.push(x);
        }
      }
    });

    for (const property in stats) {
      if (property.toString() !== 'allNegative' && property.toString() !== 'allPositive' && property.toString() !== 'adjustedNegative') {
        stats[property].successPercent =
          (stats[property].positive.length / (stats[property].positive.length + stats[property].adjustedNegative.length)).toFixed(2);
      }
    }
    res.send({ data: stats });
    return;
  } catch (err) {
    console.error("Error adding document: ", err);
    res.status(500).send(err.message);
    return;
  }
});


exports.callStatsInPeriod = functions.https.onCall((data, context) => {
  var stats = [];
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);


  return db.collection('allStats')
    .where('createdAt', '>', startDate)
    .where('createdAt', '<', endDate)
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(doc => {
        var newelement = {
          "id": doc.id,
          "createdAt": doc.data().createdAt,
          "isPositive": doc.data().isPositive,
          "playerName": doc.data().playerName,
          "statID": doc.data().statID,
          "statName": doc.data().statName,
        }
        stats = stats.concat(newelement);
      });
      return stats;
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });
});


exports.callStatsInDay = functions.https.onCall((data, context) => {
  var stats = [];
  const startDate = new Date(data.startDate);
  const endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000));

  return db.collection('allStats')
    .where('createdAt', '>', startDate)
    .where('createdAt', '<', endDate)
    .get()
    .then(function (querySnapshot) {
      querySnapshot.forEach(doc => {
        var newelement = {
          "id": doc.id,
          "createdAt": doc.data().createdAt,
          "isPositive": doc.data().isPositive,
          "playerName": doc.data().playerName,
          "statID": doc.data().statID,
          "statName": doc.data().statName,
        }
        stats = stats.concat(newelement);
      });
      return stats;
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });
});


// These functions get called from within the app


//add player
// exports.addPlayer = functions.https.onCall((data, context) => {
//   let player = {
//     playerID: data.playerID,
//     playerName: data.playerName,
//     teamID: data.teamID
//   }
//   db.collection("players").add(player).then(function () {
//     return player;
//   })
// });

// //delete player
// exports.deletePlayer = functions.https.onCall((data, context) => {
//   let playerName = data.playerName;

//   db.collection("players")
//     .where("playerName", "==", playerName)
//     .get().then(snapshot => {
//       snapshot.forEach(doc => {
//         doc.ref.delete();
//       });
//     }).catch(reason => {
//       return "Didn't work!";
//     });
//   return "Done";
// });

//add stat to database
// exports.addStatToDatabase = functions.https.onCall((data, context) => {
//   let stat = {
//     createdAt: admin.firebase.getTimestamp(new Date()),
//     isPositive: data.isPositive,
//     playerName: data.playerName,
//     statID: Math.random() * 1000,
//     statName: data.statName
//   }
//   return db.collection("allStats").add(stat)
//     .then((x) => {
//       return [x, 'poop', admin.database.ServerValue.TIMESTAMP];
//     }).catch(reason => {
//       return reason;
//     })
// });

// exports.deleteStatFromDatabase = functions.https.onCall((data, context) => {
//   let ID = data.statID;

//   return admin.firestore().collection("allStats")
//     .where("statID", "==", parseFloat(ID))
//     .get().then(snapshot => {
//       snapshot.forEach(doc => {
//         doc.ref.delete();
//       });
//     }).catch(reason => {
//       return "Didn't work!";
//     });
//   return "Done";
// });


/**
 * THIS ONE DOESNT WORK :(
 */
// exports.callStatsForPlayerInPeriod = functions.https.onCall((data, context) => {
//   var stats = [];
//   const startDate = new Date(data.startDate);
//   const endDate = new Date(data.endDate);
//   const playerName = data.playerName;

//   return db.collection('allStats')
//     .where("playerName", "==", playerName)
//     .where('createdAt', '>', startDate)
//     .where('createdAt', '<', endDate)
//     .get()
//     .then(function (querySnapshot) {
//       querySnapshot.forEach(doc => {
//         var newelement = {
//           "id": doc.id,
//           "createdAt": doc.data().createdAt,
//           "isPositive": doc.data().isPositive,
//           "playerName": doc.data().playerName,
//           "statID": doc.data().statID,
//           "statName": doc.data().statName,
//         }
//         stats = stats.concat(newelement);
//       });
//       return stats
//     })
//     .catch(function (error) {
//       console.error("Error adding document: ", error);
//     });
// });

/**
 * Get all stats for a player within a time period
 */
// exports.getAllStatsForPlayerInPeriod = functions.https.onRequest((req, res) => {
//   var stats = [];
//   const startDate = new Date(req.query.startDate);
//   const endDate = new Date(req.query.endDate);

//   db.collection("allStats")
//     .where("playerName", "==", req.query.playerName)
//     .where('createdAt', '>', startDate)
//     .where('createdAt', '<', endDate)
//     .get().then(snapshot => {
//       snapshot.forEach(doc => {
//         var newelement = {
//           "id": doc.id,
//           "createdAt": doc.data().createdAt,
//           "isPositive": doc.data().isPositive,
//           "playerName": doc.data().playerName,
//           "statID": doc.data().statID,
//           "statName": doc.data().statName,
//         }
//         stats = stats.concat(newelement);
//       });
//       res.send(stats)
//       return "";
//     }).catch(reason => {
//       res.send(reason)
//     })
// });