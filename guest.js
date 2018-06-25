var firebase = require("firebase");

// Firebase config
var config = {
  apiKey: "AIzaSyDpBtpDYu0a4roRChP0yWBgAu9yPB3lrjc",
  authDomain: "ocpp-database.firebaseapp.com",
  databaseURL: "https://ocpp-database.firebaseio.com",
  storageBucket: "ocpp-database.appspot.com",
};
firebase.initializeApp(config);

// Get a reference to the database service
var database = firebase.database();
var ref = database.ref("/reservation");

// Attach an asynchronous callback to read the data at our posts reference
ref.once("value", function(snapshot) {
    console.log(snapshot.val());
}, function (errorObject) {console.log("The read failed: " + errorObject.code); });