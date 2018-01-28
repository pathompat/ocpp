const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080/ocpp/CP001');

ws.on('open', function open() {
  ws.send('test');
});

ws.on('message', function incoming(data) {
  console.log(data);
});
