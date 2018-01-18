var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
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

// Database Reference node
//var ref = database.ref('authorize');

//Time use in Server
var now = new Date();
//console.log(now);

function checkTag(payload,callback){
  var ref = database.ref('/authorize').child(payload.idTag);
  ref.on("value", function(data) {
    if (data.val() == null){ callback("Invalid");}
    else{
      var expire = new Date(data.val().expiredate);
      if(expire.getTime() < now.getTime()) callback("Expired");
      else if(data.val().blocked) callback("Blocked");
      else callback("Accepted");
    }
  }, function (error) {
    console.log("Error: " + error.code);
  });
}

function authorize(json,callback){
  var package = {"idTagInfo":{"status" : null}};
  checkTag(json[3], status => {
    package.idTagInfo.status = status;
    callback(JSON.stringify([3,json[1],package]));
  })
}

function startTransaction(json,cpid,callback){
  var package = {"idTagInfo":{"status":null},"transactionid":null};
  var payload = json[3];

  var ref = database.ref('/transaction').orderByKey().limitToLast(1);
  
  ref.once('value').then( function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var transactionId = parseInt(childSnapshot.key)+1;
      checkTag(json[3], status => {
        package.idTagInfo.status = status;
        package.transactionid = transactionId;
        callback(JSON.stringify([3,json[1],package]));
      });
  
      var insertref = database.ref('/transaction').child(String(transactionId));
      insertref.set({
        cpid : cpid,
        connectorid : payload.connectorId,
        starttransaction : {
          timestart : payload.timestamp,
          meterstart : payload.meterStart 
        }
      });
    });
  },function (error) {
    console.log("Error: " + error.code);
  });
}

function stopTransaction(json,callback){
  var package = {"idTagInfo":{"status":null}};
  var payload = json[3];

  checkTag(json[3], status => {
    package.idTagInfo.status = status;
    callback(JSON.stringify([3,json[1],package]));
  });

  var ref = database.ref('/transaction').child(String(payload.transactionId)).child('stoptransaction');

  ref.update({
     //stoptransaction : {
       timestop : payload.timestamp,
       meterstop : payload.meterStop
     //}
  });
}

function heartbeat(uniqueId,payload){
  var package = {"currentTime":null};
  package.currentTime = Date.now();
  return JSON.stringify([3,uniqueId,package])
}

function rpcFramework(uniqueId,payload,name){
  var package = {};
  return JSON.stringify([3,uniqueId,name,package])
}

app.ws('/ocpp/:id', function(ws, req) {
  var cpid = req.params.id;
  console.log(cpid);   //show charge point's identity before

  //Send message thru Web Socket Connection
  function wssendback(package){
    console.log('sent: %s',package);
    ws.send(package);
  }

  //Check RPC message type
  function checkRpc(json,callback,error){
    if (json[0] == 2) callback(json[2]);
    else if(json[0] == 3) error("it's a CALLRESULT.");
    else error("it's not a RPC message.");
  }

  ws.on('message', (mes) => {
    console.log('received: %s', mes);
    var json = JSON.parse(mes);
    checkRpc(json, function(messageType) {
      switch(messageType) {
        case "Authorize": authorize(json,wssendback);
        break;
        case "StartTransaction": startTransaction(json,cpid,wssendback);
        break;
        case "StopTransaction": stopTransaction(json,wssendback);
        break;
        case "Heartbeat": ws.send(heartbeat(json[1],json[3]));
        break;
        case "StatusNotification": ws.send(rpcFramework(json[1],json[3],json[2]));
        break;
        case "MeterValues": ws.send(rpcFramework(json[1],json[3],json[2]));
        break;
        default: console.log("error : Your message is not registered");
      }
    }, function(err) { console.log(err); });
  });
});

app.listen(80 , () => {
  console.log('Listening on port 80');
});