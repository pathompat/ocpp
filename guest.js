var firebase = require("firebase");
var config = {
  apiKey: "AIzaSyDpBtpDYu0a4roRChP0yWBgAu9yPB3lrjc",
  authDomain: "ocpp-database.firebaseapp.com",
  databaseURL: "https://ocpp-database.firebaseio.com",
  storageBucket: "ocpp-database.appspot.com",
};
firebase.initializeApp(config);

//Time use in Server
var now = new Date();

// Get a reference to the database service
var database = firebase.database();

var ref = database.ref()
ref.on("value", function(data) {
  console.log(data.val());
}, function (error) {
  console.log("Error: " + error.code);
});