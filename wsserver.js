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
        },
        //reservationId : (payload.reservationId == undefined || payload.reservationId == null) ? payload.reservationId : "0";
      });

      //Update id has reservationId
      if(payload.reservationId != undefined || payload.reservationId != null){
        insertref.update({
          reservationId : payload.reservationId
        });
      }

    });
  },function (error) {console.log("Error: " + error.code);});
}

function stopTransaction(json,callback){
  var package = {"idTagInfo":{"status":null}};
  var payload = json[3];
  var rid = 0;

  checkTag(json[3], status => {
    package.idTagInfo.status = status;
    callback(JSON.stringify([3,json[1],package]));
  });

  var ref = database.ref('/transaction').child(String(payload.transactionId)).child('stoptransaction');

  ref.update({
       timestop : payload.timestamp,
       meterstop : payload.meterStop
  });

  var reserveRef = database.ref('/transaction').child(String(payload.transactionId));

  reserveRef.once("value",(snap) =>{
    var rid = snap.val().reservationId;
    if(rid != null || rid != undefined){
        database.ref('/reservation').child(String(rid)).update({
            status : "Finished"
        });
        console.log("Reservation Finish!");
    }
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
  callback(uniqueId,"ReserveNow",json);
}

function cancelReservation(json,callback){
  var uniqueId = crypto.randomBytes(20).toString('hex');
  callback(uniqueId,"CancelReservation",json);
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
          chkDatabase("Pending", reserveNow);
          chkDatabase("Canceling" , cancelReservation);
          console.log(sendList);
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
          try{
            if(sendList.length > 0){
              sendList.find( (data,index) => {
                  //Check UniqueId if match contunue check
                  if(data[0] == json[1]) {

                    //Check message if ReserveNow go update db Accepted/Error
                    if(data[1] == "ReserveNow"){
                      var ref = database.ref('/reservation').child(String(data[2]));
                      ref.update({
                            status : payload.status,
                      });

                    //Check message if CancelReservation go update db to Canceled
                    }else if(data[1] == "CancelReservation"){
                      var ref = database.ref('/reservation').child(String(data[2]));
                      ref.update({
                            status : "Canceled",
                      });
                    }
                    sendList.splice(index,1); //Remove value in list after update
                  }
              });
            }
            }catch(e){console.log(e);}
    });
  });

  //Send message thru Web Socket Connection
  function wssendback(package){
    console.log('sent: %s',package);
    ws.send(package);
  }

  function chkDatabase(status,sendMsg){
    var refPending = database.ref("/reservation").orderByChild("status").equalTo(status);
    refPending.once("value", function(snapshot) {
        snapshot.forEach( function(childSnapshot){
            var childData = childSnapshot.val();
            childData.key = childSnapshot.key;
            if(childData.cpid == cpid) {
              sendMsg(childData, sendPiggyback);
            }
        });
    }, function (err) {console.log("failed: "+err.code); });
  }

  // function chkCanceling(){ 
  //   var refCancel = database.ref("/reservation").orderByChild("status").equalTo("Canceling");
  //   refCancel.once("value", function(snapshot) {
  //     snapshot.forEach( function(childSnapshot){
  //       var childData = childSnapshot.val();
  //       childData.key = childSnapshot.key;
  //       if(childData.cpid == cpid) {
  //           cancelReservation(childData, sendPiggyback);
  //       }
  //     });
  //   }, function (err) {console.log("failed: "+err.code); });
  // }

  function sendPiggyback(uniqueId,messageName,data){
    sendList.push([uniqueId,messageName,data.key]);
    var payload = new Object();
    switch(messageName) {
      case "ReserveNow": payload = { connectorId : data.connectorId, expiryDate : data.expiryDate,
                          idTag : data.idTag, reservationId : parseInt(data.key) };
      break;
      case "CancelReservation": payload = { reservationId : parseInt(data.key) };
      break;
      default: console.log("error : Your message is not registered");
    }
    var ocppmsg = JSON.stringify([2,uniqueId,messageName,payload]);
    console.log('sent : %s', ocppmsg);
    ws.send(ocppmsg);
  }

  //Check RPC message type
  function checkRpc(json,call,callresult){
    try{
      if (json[0] == 2) call(json[2]);
      else if(json[0] == 3) callresult(json[2]);
      else if(json[0] == 4) console.log("Error Message!")
      else console.log("it's not a RPC message.");
    }catch(err){console.log(err);}
  }

  //Check Pending Status
  function checkDatabase(){
    //pass
  }

});

app.listen(80 , () => {
  console.log('Listening on port 80');
});