var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
}).listen(8080, 'ocpp-server-test.herokuapp.com');
console.log('Server running at http://ocpp-server-test.herokuapp.com:8080/');