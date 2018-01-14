var util = require('../index').util
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
    for (var i = 0; i < 102; i++) {
        var conf = util.deep.set('name', 'inge+' + i);
        var obj = util.deep.get(conf, 'name');
        var keys = util.deep.keys(conf);
        var keyValues = util.deep.keyValues(conf);
        console.log('config value:\t', obj, keys, keyValues);
    }
    var diff = heapDiff.end();
    console.log('heap-memory diff:\n', inspect(diff));
    count++;
    if (count === 27) {
        clearInterval(id);
        process.exit(0);
    }
}, 3000);
