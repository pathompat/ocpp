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
console.log(now);

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

function authorize(uniqueId,payload,callback){
  var package = {"idTagInfo":{"status" : null}};
  checkTag(payload, status => {
    package.idTagInfo.status = status;
    callback(JSON.stringify([3,uniqueId,package]));
  })
}

function startTransaction(uniqueId,payload){
  var package = {"idTagInfo":{"status":"Accepted"},"transactionid":1};
  package.idTagInfo.status = checkTag(payload);
  return JSON.stringify([3,uniqueId,package])
}

function stopTransaction(uniqueId,payload){
  var package = {"idTagInfo":{"status":"Accepted"}};
  package.idTagInfo.status = checkTag(payload);
  return JSON.stringify([3,uniqueId,package])
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
  console.log(req.params.id);   //show charge point's identity before

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
    //console.log('received: %s', mes);
    var json = JSON.parse(mes);
    checkRpc(JSON.parse(mes), function(messageType) {
      switch(messageType) {
        case "Authorize": authorize(json[1],json[3],wssendback);
        break;
        case "StartTransaction": ws.send(startTransaction(json[1],json[3]));
        break;
        case "StopTransaction": ws.send(stopTransaction(json[1],json[3]));
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