//var http = require('http');
//const WebSocket = require('ws');
var autobahn = require('autobahn');

var connection = new autobahn.Connection(
  {
    url: 'ws://127.0.0.1:8080/ws',
    realm: 'realm1'
  }
);

connection.onopen = function (session) {
 // BootNotification Procedure
 function BootNotification(args) {
    var messageType = 3;        //Call Result
    var uniqueId = args[1];      //unique returned
    var payload = {"status":"Accepted", "currentTime": "4:02" , "heartbeatInterval":300};
    return [messageType, uniqueId, payload];
 }

 function Authorize(args){
    var messageType = 3;        //Call Result
    var uniqueId = args[1];      //unique id equal from call
    if(args[3] == "123456789"){
      var payload = {"status":"Authorized", "username": "Pathompat"};
    }else{
      var payload = {"status":"Unauthorized"};
    }
    return [messageType, uniqueId, payload];
 }

 function IsAvailiable(params){
   return params[0][1];
 }


 // Register Boot Notification
 session.register('com.myapp.boot', BootNotification);
 session.register('com.myapp.hi', IsAvailiable);
 session.register('com.myapp.auth', Authorize);
}
connection.open();
console.log("Connection Opened");