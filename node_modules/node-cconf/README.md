[![Build Status](https://travis-ci.org/christian-raedel/node-cconf.svg?branch=master)](https://travis-ci.org/christian-raedel/node-cconf)

# CConf #

A [node.js](http://nodejs.org) module which holds the configuration 
of your node application. The configuration consists of *required 
and optional key/value-pairs* and their appropriate *default values* 
with the ability to *load* themselves *from and write to files*.

## Installation ##

```
npm install --save git+https://github.com/christian-raedel/node-cconf.git#v0.3.3
```

### Testing ###

```
cd /path/to/node-cconf
make install test
```

### Documentation ###

```
cd /path/to/node-cconf
make install docs
$BROWSER doc/index.html
```
or [browse API docs online](http://christian-raedel.github.io/node-cconf/index.html)

## Basic Usage ##

``` Javascript
var CConf = require('node-cconf')
    , https = require('https')
    , fs = require('fs');

// Create a new config named 'server' with the required keys 'port',
// 'https:cert' and 'https:key' and the given default values for the
// required keys.
var conf = new CConf('server', ['port', 'https:cert', 'https:key'], {
    port: 3000,
    https: {
        cert: fs.readFileSync(__dirname + '/.config/server.crt'),
        key: fs.readFileSync(__dirname + '/.config/server.key')
    }
});

// The 'load' method can be feeded with an ARGV array. So calling
// the script with 'node server.js --port=9000' will overwrite the
// default port.
conf.load(process.argv);

// Customize 'port' of the example server.
conf.setValue('port', 8080);

// Create an example https-server with previous defined configuration.
// As server options, the default values are taken and for the port
// to listen to, the configuration chooses the customized value.
var server = https.createServer(conf.getValue('https'))
.listen(conf.getValue('port'));

// When application ends, write the server configuration to a YAML file.
// Supported export targets are: JSON, YAML, Object and a custom
// function.
process.on('exit', function() {
    conf.save(__dirname + '/.config/server.yml');
});
```
