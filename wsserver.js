var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var firebase = require("firebase");
//var Queue = require('queuejs');
 
var list = [];

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
      else callback("Accepted",data.val().name,data.val().amount);
    }
  }, function (error) {
    console.log("Error: " + error.code);
  });
}

function authorize(json,callback){
  var package = {"idTagInfo":{"status" : null}};
  checkTag(json[3], (status,name,amount) => {
    package.idTagInfo.status = status;
    package.idTagInfo.name = name;
    package.idTagInfo.amount = amount;
    callback(JSON.stringify([3,json[1],package]));
  })
}

function startTransaction(json,cpid,callback){
  var package = {"idTagInfo":{"status":null},"transactionId":null};
  var payload = json[3];

  var ref = database.ref('/transaction').orderByKey().limitToLast(1);
  
  ref.once('value').then( function(snapshot) {
    snapshot.forEach(function(childSnapshot) {

      //Check Tag Before Start Transaction
      var transactionId = parseInt(childSnapshot.key)+1;
      checkTag(json[3], status => {
        package.idTagInfo.status = status;
        package.transactionId = transactionId;
        callback(JSON.stringify([3,json[1],package]));
      });

      //Save data to db after send ocpp message
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

function heartbeat(json,callback){
  var package = {"currentTime":now};
  callback(JSON.stringify([3,json[1],package]));
}

function meterValues(json,cpid,callback){
  //var package = {}; 
  var payload = json[3];
  var conid = payload.connectorId;
  var ref = database.ref('/chargerstation').child(cpid).child("connector").child(conid);
  callback(JSON.stringify([3,json[1],{}]));
  ref.update({
    "metervalue": payload.meterValue.sampledValue.value
  });
  
}

function statusNotification(json,cpid,callback){
  var payload = json[3];
  var conid = payload.connectorId;
  var ref = database.ref('/chargerstation').child(cpid).child("connector").child(conid);
  ref.update({
    "status": payload.status
  });
  callback(JSON.stringify([3,json[1],{}]));
}

function bootNotification(json,cpid,callback){
  var payload = json[3];
  var package = {"currentTime":now,"interval":3600,"status":"Rejected"};
  var interval = null;
  var ref = database.ref('/chargerstation').child(cpid);
  ref.once('value').then(function(dataSnapshot) {
    var data = dataSnapshot.val();
    interval = data.heartbeatinterval;
    //console.log(interval);
  });
  ref.update(json[3],function(error){
    package.status = "Accepted";
    package.interval = interval;
    callback(JSON.stringify([3,json[1],package]));
  });
  //callback(JSON.stringify([3,json[1],package]));
}

function reserveNow(json,callback){
  callback(JSON.stringify([2,"uSf1t12mu6qNsE11NURHJIFXw3GdJDLJ","ReserveNow",json]));
}

app.ws('/ocpp/:id', function(ws, req) {

  var cpid = req.params.id;
  console.log(cpid);   //show charge point's identity
  
  ws.on('message', (mes) => {    
    
    console.log('received: %s', mes);

    //Parsing received message from String to JSON
    var json = JSON.parse(mes);

    //Webapp command
    if(cpid == "webapp"){
      list.push(json);
      //console.log(list); 
    }
    
    //Check message format if it is RPC check message type
    checkRpc(json, function(messageType) {
      //console.log(list);
      switch(messageType) {
        case "Authorize": authorize(json,wssendback);
        break;
        case "StartTransaction": startTransaction(json,cpid,wssendback);
        break;
        case "StopTransaction": stopTransaction(json,wssendback);
        break;
        case "Heartbeat": 
          if(list.length > 0){
            list.find(function(data,index){
              if(data.cpid == cpid) {
                reserveNow(data,wssendback);
                list.splice(index,1);
              }
            });
          }
          heartbeat(json,wssendback);
        break;
        case "StatusNotification": statusNotification(json,cpid,wssendback);
        break;
        case "MeterValues": meterValues(json,cpid,wssendback);
        break;
        case "BootNotification" : bootNotification(json,cpid,wssendback);
        break;
        default: console.log("error : Your message is not registered");
      }
    }, function(err) { console.log(err); });
  });

  //Send message thru Web Socket Connection
  function wssendback(package){
    console.log('sent: %s',package);
    ws.send(package);
  }

  //Check RPC message type
  function checkRpc(json,callback,error){
    if (json[0] == 2) callback(json[2]);
    else if(json[0] == 3) error("it's a CALLRESULT.");
    else if(json[0] == 4) error("Error Message!")
    else error("it's not a RPC message.");
  }

});

app.listen(80 , () => {
  console.log('Listening on port 80');
});