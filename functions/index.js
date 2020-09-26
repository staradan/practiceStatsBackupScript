const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();
const admin = require('firebase-admin');
admin.initializeApp();

const bucket = 'gs://practicestatsbackup';

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


exports.getAllStatsForPlayer = functions.https.onRequest((req, res) => {
  var stats = [];
  var db = admin.firestore();
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


exports.getStatsInPeriod = functions.https.onRequest((req, res) => {
  var db = admin.firestore();
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


exports.deleteStatByID = functions.https.onRequest((req, res) => {
  const statID = req.query.statID;

  firebase.db.collection('stats')
    .where('statID', '==', statID)
    .get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        doc.ref.delete();
      });
    });
});


exports.deleteStatInTimePeriod = functions.https.onRequest((req, res) => {
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);

  firebase.db.collection('stats')
    .where('createdAt', '>', startDate)
    .where('createdAt', '<', endDate)
    .get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        doc.ref.delete();
      });
    });
});
