var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var firebase = require("firebase");
var crypto = require("crypto");
var sendList = [];

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
  try{
    ref.on("value", function(data) {
      if (data.val() == null){ callback("Invalid");}
      else{
        var expire = new Date(data.val().expiredate);
        if(expire.getTime() < now.getTime()) callback("Expired");
        else if(data.val().blocked) callback("Blocked");
        else callback("Accepted",data.val().name,data.val().amount);
      }
    }, function (error) {console.log("Error: " + error.code); });
  }catch(e){console.log(e);}

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
  },function (error) {console.log("Error: " + error.code);});
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
       timestop : payload.timestamp,
       meterstop : payload.meterStop
  });
}

function heartbeat(json,callback){
  var package = {"currentTime":now};
  callback(JSON.stringify([3,json[1],package]));
}

function meterValues(json,cpid,callback){
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
  //var errCode = payload.errorCode;
  var ref = database.ref('/chargerstation').child(cpid).child("connector").child(conid);
  ref.update({
    "status": payload.status,
    "errorCode" : payload.errorCode
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

function dataTransfer(json,cpid,callback){
  var package = {};
  callback(JSON.stringify([3,json[1],package]));
  //console.log(json[3].data);
}

function reserveNow(json,callback){
  //var package = {};
  var uniqueId = crypto.randomBytes(20).toString('hex');
  callback(uniqueId);
}

function cancelReservation(json,callback){
  var uniqueId = crypto.randomBytes(20).toString('hex');
  callback(uniqueId);
}

app.ws('/ocpp/:id', function(ws, req) {

  var cpid = req.params.id;
  console.log('connected from : %s',cpid);   //show charge point's identity
  
  ws.on('message', (mes) => {    
    
    console.log('received: %s', mes);

    //Parsing received message from String to JSON
    var json = JSON.parse(mes);
    
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
          heartbeat(json,wssendback);
          //var list = [];
          var refPending = database.ref("/reservation").orderByChild("status").equalTo("Pending");
          refPending.once("value", function(snapshot) {
              snapshot.forEach( function(childSnapshot){
                  var key = childSnapshot.key;
                  var childData = childSnapshot.val();
                  //console.log(key,childData);
                  if(childData.cpid == cpid) {
                     //console.log("test2");
                     reserveNow( json , uniqueId => {
                        sendList.push([uniqueId,"ReserveNow",key]);
                        //console.log(sendList);
                        var data = { connectorId : childData.connectorId,expiryDate : childData.expiryDate,
                        idTag : childData.idTag, reservationId : key };
                        var reserveNow = JSON.stringify([2,uniqueId,"ReserveNow",data]);
                        console.log('sent : %s', reserveNow);
                        ws.send(reserveNow);
                           
                     });
                  }
              });

          var refCancel = database.ref("/reservation").orderByChild("status").equalTo("Canceling");
          refCancel.once("value", function(snapshot) {
            snapshot.forEach( function(childSnapshot){
              var key = childSnapshot.key;
              var childData = childSnapshot.val();
              //console.log(key,childData);
              if(childData.cpid == cpid) {
                  cancelReservation( json , uniqueId => {
                    sendList.push([uniqueId,"CancelReservation",key]);
                    //console.log(sendList);
                    var data = { reservationId : key };
                    var cancel = JSON.stringify([2,uniqueId,"CancelReservation",data]);
                    console.log('sent : %s', cancel);
                    ws.send(cancel);
                  });
              }
            });
          });
          console.log(sendList);
        }, function (err) {console.log("failed: "+err.code); });
        break;
        case "StatusNotification": statusNotification(json,cpid,wssendback);
        break;
        case "MeterValues": meterValues(json,cpid,wssendback);
        break;
        case "BootNotification" : bootNotification(json,cpid,wssendback);
        break;
        case "DataTransfer" : dataTransfer(json,cpid,wssendback);
        break;
        default: console.log("error : Your message is not registered");
      }
    }, function(payload) {
        if(sendList.length > 0){
          sendList.find( (data,index) => {
            try{
              if(data[0] == json[1]) {
                console.log(1);
                if(data[1] == "ReserveNow"){
                  var ref = database.ref('/reservation').child(String(data[2]));
                  ref.update({
                        status : payload.status,
                  });
                }else if(data[1] == "CancelReservation"){
                  console.log(2);
                  var ref = database.ref('/reservation').child(String(data[2]));
                  ref.update({
                        status : "Canceled",
                  });
                }
                sendList.splice(index,1);
              }
            }catch(e){console.log(e);}
          });
        }
    });
  });

  //Send message thru Web Socket Connection
  function wssendback(package){
    console.log('sent: %s',package);
    ws.send(package);
  }

  //Check RPC message type
  function checkRpc(json,call,callresult){
    if (json[0] == 2) call(json[2]);
    else if(json[0] == 3) callresult(json[2]);
    else if(json[0] == 4) console.log("Error Message!")
    else console.log("it's not a RPC message.");
  }

  //Check Pending Status
  function checkPending(){
    //pass
  }

});

app.listen(80 , () => {
  console.log('Listening on port 80');
});