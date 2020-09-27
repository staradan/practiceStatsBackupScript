const cors = require('cors')({ origin: true });
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const bucket = 'gs://practicestatsbackup';

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
 * Get all stats for a player within a time period
 */
exports.getAllStatsForPlayerInPeriod = functions.https.onRequest((req, res) => {
  var stats = [];
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);

  db.collection("allStats")
    .where("playerName", "==", req.query.playerName)
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
  const startDate = new Date(req.query.day);
  const endDate = new Date(startDate.getTime() + (24 * 60 * 60 * 1000));
  var stats = [];
  db.collection("allStats")
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

// These functions get called from within the app


//add player
exports.addPlayer = functions.https.onCall((data, context) => {
  let player = {
    playerID: data.playerID,
    playerName: data.playerName,
    teamID: data.teamID
  }
  db.collection("players").add(player).then(function () {
    return player;
  })
});

//delete player
exports.deletePlayer = functions.https.onCall((data, context) => {
  let playerName = data.playerName;

  db.collection("players")
    .where("playerName", "==", playerName)
    .get().then(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.delete();
      });
    }).catch(reason => {
      return "Didn't work!";
    });
  return "Done";
});

exports.callAllPlayers = functions.https.onCall((data, context) => {
  var players = [];

  return admin.firestore().collection('players')
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


//add stat to database
exports.addStatToDatabase = functions.https.onCall((data, context) => {
  let stat = {
    createdAt: data.createdAt,
    isPositive: data.isPositive,
    playerName: data.playerName,
    statID: data.statID,
    statName: data.statName
  }
  db.collection("allStats").add(stat).then(function () {
    return stat;
  })
});

exports.deleteStatFromDatabase = functions.https.onCall((data, context) => {
  let ID = data.statID;

  db.collection("allStats")
    .where("statID", "==", parseFloat(ID))
    .get().then(snapshot => {
      snapshot.forEach(doc => {
        doc.ref.delete();
      });
    }).catch(reason => {
      return "Didn't work!";
    });
  return "Done";
});


exports.callAllStatsForPlayer = functions.https.onCall((data, context) => {
  var stats = [];
  const playerName = data.playerName;

  return admin.firestore().collection('allStats').where('playerName', '==', playerName).get()
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

/**
 * THIS ONE DOESNT WORK :(
 */
exports.callStatsForPlayerInPeriod = functions.https.onCall((data, context) => {
  var stats = [];
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const playerName = data.playerName;

  return admin.firestore().collection('allStats')
    .where("playerName", "==", playerName)
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
      return stats
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });
});

exports.callStatsInPeriod = functions.https.onCall((data, context) => {
  var stats = [];
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  return admin.firestore().collection('allStats')
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

  return admin.firestore().collection('allStats')
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