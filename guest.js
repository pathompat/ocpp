// var firebase = require("firebase");
// var config = {
//   apiKey: "AIzaSyDpBtpDYu0a4roRChP0yWBgAu9yPB3lrjc",
//   authDomain: "ocpp-database.firebaseapp.com",
//   databaseURL: "https://ocpp-database.firebaseio.com",
//   storageBucket: "ocpp-database.appspot.com",
// };
// firebase.initializeApp(config);

// //Time use in Server
// var now = new Date();

// // Get a reference to the database service
// var database = firebase.database();

// var ref = database.ref()
// ref.on("value", function(data) {
//   console.log(data.val());
// }, function (error) {
//   console.log("Error: " + error.code);
// });

var Queue = require('queuejs');
 
var queue = new Queue();

var data = {"connectorid":0,"cpid":"CP001","expiryDate":"Sun Jan 14 2019 21:22:55 GMT+0700 (Local Standard Time)",
            "idTag":"79DEF69"};
queue.enq(10);
queue.enq(data.cpid);
queue.size(); // 2 
queue.peek(); // 10 
//queue.deq(); // 10 
queue.size(); // 1 
console.log(queue);