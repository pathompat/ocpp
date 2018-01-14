var http = require('http');
const WebSocket = require('ws');
var autobahn = require('autobahn');

var connection = new autobahn.Connection(
  {
    url: 'ws://127.0.0.1:8080/ocpp',
    realm: 'realm1'
  }
);

var packet = [
   2, 
   "19223201", 
   "BootNotification",
 {"chargePointVendor": "VendorX", "chargePointModel": "SingleSocketCharger"} 
] ;

connection.onopen = function (session) {
 //Call BootNotification
session.call('com.myapp.boot', packet).then(
  res => {
    console.log(res);
  }, session.log);
}

connection.open();
//console.log(connection.transport);
