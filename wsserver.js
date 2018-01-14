var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);

function checkTag(payload){
  if(payload.idTag == "D86F20CE"){
    return "Accepted";
  }else if (payload.idTag == "73A6F02D"){
    return "Blocked";
  }else{
    return "Invalid";
  }
}

function authorize(uniqueId,payload){
  var package = {"idTagInfo":{"status" : null}};
  package.idTagInfo.status = checkTag(payload);
  return JSON.stringify([3,uniqueId,package])
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
  console.log(req.params.id);
  ws.on('message', (mes) => {
    console.log('received: %s', mes);
    var json = JSON.parse(mes);
    if(json[0] == 2){
      switch(json[2]) {
        case "Authorize":
          console.log('send: %s', authorize(json[1],json[3]));
          ws.send(authorize(json[1],json[3]));
          break;
        case "StartTransaction":
          ws.send(startTransaction(json[1],json[3]));
          break;
        case "StopTransaction":
          ws.send(stopTransaction(json[1],json[3]));
          break;
        case "Heartbeat":
          ws.send(heartbeat(json[1],json[3]));
          break;
        case "StatusNotification":
          ws.send(rpcFramework(json[1],json[3],json[2]));
          break;
        case "MeterValues":
          ws.send(rpcFramework(json[1],json[3],json[2]));
          break;
        default:
          console.log("error");
      }
    }
  });
});

app.listen(80 , () => {
  console.log('Listening on port 80');
});