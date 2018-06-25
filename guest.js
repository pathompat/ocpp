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
var ref = database.ref("/reservation").orderByChild("status").equalTo("Pending");

// Attach an asynchronous callback to read the data at our posts reference
//console.log(ref);
ref.once("value", function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
        var key = childSnapshot.key;
        var childData = childSnapshot.val();
        (childData);
    });
}, function (errorObject) {console.log("The read failed: " + errorObject.code); });