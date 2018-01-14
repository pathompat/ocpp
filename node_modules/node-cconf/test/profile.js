var CConf = require('../index')
    , inspect = require('eyes').inspector()
    , memwatch = require('memwatch');

console.log('starting profiling');

memwatch.on('leak', function (info) {
    console.log('memory leak:\n', inspect(info));
});

memwatch.on('stats', function (stats) {
    console.log('memory stats:\n', inspect(stats));
});

var count = 0;
var id = setInterval(function () {
    var heapDiff = new memwatch.HeapDiff();
    var conf = new CConf('profiling', ['name'], {name: 'inge'});
    for (var i = 0; i < 102; i++) {
        var t = conf.getValue('name');
        console.log('config value:\t', t);
        conf.setValue('name', 'inge+' + i);
    }
    var diff = heapDiff.end();
    console.log('heap-memory diff:\n', inspect(diff));
    count++;
    if (count === 27) {
        clearInterval(id);
        process.exit(0);
    }
}, 3000);
