var CPlate = require('../index').CPlate
    , memwatch = require('memwatch')
    , inspect = require('eyes').inspector();

memwatch.on('leak', function (info) {
    console.log('memory leak:\t', inspect(info));
});

memwatch.on('stats', function (stats) {
    console.log('memory stats:\t', inspect(stats));
});

var cplate = new CPlate();
var count = 0;
var id = setInterval(function () {
    var heapDiff = new memwatch.HeapDiff();
    for (var i = 0; i < 102; i++) {
        var str = cplate.format('current time: {{date|datetime:HH:mm:ss|colorize:grey}}', {date: new Date()});
        str += cplate.format(' samples: {{value|rightalign:10|camelcase|capitalize|uppercase}}', {value: 'inge'});
        str += cplate.format(' samples: {{value2|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value3|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value4|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value5|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value6|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value7|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value8|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value9|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value10|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value11|rightalign:10|camelcase|capitalize|colorize:zalgo}}{{value12|rightalign:10|camelcase|capitalize|colorize:zalgo}}', {
            value2: 'inge',
            value3: '$inge',
            value4: '$inge',
            value5: '$inge',
            value6: '$inge',
            value7: '$inge',
            value8: '$inge',
            value9: '$inge',
            value10: '$inge',
            value11: '$inge',
            value12: '$inge',
        });
        console.log(str);
    }
    var diff = heapDiff.end();
    console.log('memory heap diff:\t', inspect(diff));
    count++;
    if (count === 27) {
        clearInterval(id);
        process.exit(0);
    }
}, 3000);
