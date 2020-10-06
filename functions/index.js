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

exports.getPlayers = functions.https.onCall(async (data, context) => {
  let players = [];
  try {
    let playersQuery = await db.collection('players').get();
    await playersQuery.forEach(doc => { players = players.concat(doc.data()) });
  } catch (reason) {
    return reason;
  }
  return { players: players };
});

exports.getStatsInPeriod = functions.https.onCall(async (data, context) => {
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
    let statsQuery = await db.collection('allStats').where('createdAt', '>=', startDate).where('createdAt', '<=', endDate).get();

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


exports.getStatListInPeriod = functions.https.onCall(async (data, context) => {
  var stats = [];
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);


  return db.collection('allStats')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
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