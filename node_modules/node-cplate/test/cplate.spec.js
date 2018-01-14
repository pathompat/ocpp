var _        = require('lodash')
    , fs     = require('fs')
    , expect = require('chai').expect
    , CPlate = require('../index').CPlate;

describe('CPlate', function() {
    var cplate = null;

    beforeEach(function() {
        cplate = new CPlate();
    });

    it('should instanciates', function() {
        expect(cplate).to.be.an.instanceof(CPlate);
    });

    it('should register a new filter function', function() {
        expect(cplate.registerFilter('echo', function(value) { return value; })).to.be.an.instanceof(CPlate);
        expect(cplate.config.getValue('filter')['echo']).to.be.a('function');
    });

    it('should format a string', function() {
        var str = cplate.format('{{value|filterA|filterB}}', {value: 43});
        expect(str).to.be.equal('43');

        cplate.registerFilter('filterA', function(value) {
            return value - 1;
        });
        cplate.registerFilter('filterB', function(value) {
            return 'Meaning of Life = ' + value;
        });

        str = cplate.format('{{value|filterA|filterB}}', {value: 43});
        expect(str).to.be.equal('Meaning of Life = 42');
    });

    it('should format a string with argumented filter', function() {
        cplate.registerFilter('filterA', function(value, opts, placeholder, param) {
            param = parseInt(param);
            return value + param;
        });

        var str = '{{value|filterA:-1}}';
        expect(cplate.format(str, {value: 43})).to.be.equal('42');
    });

    it('should format a string with multiple argumented filters', function() {
        cplate.registerFilter('filterA', function(value, opts, placeholder, param) {
            return opts['add'].apply(null, [value, param]);
        }).registerFilter('filterB', function(value, opts, placeholder, param) {
            param = parseInt(param);
            return value / param;
        });

        var str = 'Is the Meaning of Life {{life|filterB:2}} or {{inge|filterA:6|filterB:7}}?';
        expect(cplate.format(str, {life: 84, inge: 43, add: function(a, b) { return a + b; }}))
            .to.be.equal('Is the Meaning of Life 42 or 7?');
    });

    it('should use a filter as chain starting point', function () {
        cplate.registerFilter('filterB', function (opts) {
            expect(opts).to.have.property('name', 'inge');
            return 'egni';
        });
        expect(cplate.format('{{filterB|uppercase}}', {name: 'inge'})).to.be.equal('EGNI');
    });

    it('should unregister a filter', function() {
        cplate.registerFilter('echo', function(value) { return value; });
        expect(cplate.unregisterFilter('echo')).to.be.an.instanceof(CPlate);
        expect(cplate.config.getValue('filter')['echo']).to.be.not.ok;
    });

    it('should format an array of strings', function() {
        expect(cplate.formatArray([
            '{{value}} is the Meaning of Life!',
            'The Meaning of Life is {{value}}!'
        ], {value: 42})).to.be.deep.equal([
            '42 is the Meaning of Life!',
            'The Meaning of Life is 42!'
        ]);
    });

    it('should resolve a value by path', function () {
        expect(cplate.format('{{value.key||uppercase}}', {value: {key: 'twenty-seven'}})).to.be.equal('TWENTY-SEVEN');
    });
});

describe('CPlate:Errors', function() {
    var cplate = null;

    beforeEach(function() {
        cplate = new CPlate();
    });

    it('registerFilter: should throw on invalid arguments', function() {
        expect(cplate.registerFilter.bind(cplate, 'filterA', 'no function')).to.throw(TypeError);
        expect(cplate.registerFilter.bind(cplate)).to.throw(TypeError);
    });

    it('unregisterFilter: should throw on invalid arguments', function() {
        expect(cplate.unregisterFilter.bind(cplate, 123)).to.throw(TypeError);
    });

    it('format: should throw on invalid arguments', function() {
        expect(cplate.format.bind(cplate, '')).to.throw(TypeError);
    });

    it('formatArray: should throw on invalid arguments', function() {
        expect(cplate.formatArray.bind(cplate, '', {})).to.throw(TypeError);
    });
});

describe('CPlate:Filters', function() {
    var cplate = null;

    beforeEach(function() {
        cplate = new CPlate();
    });

    it('should right align text', function() {
        expect(cplate.format('{{value|rightalign:5}}', {value: 43})).to.be.equal('   43');
        expect(cplate.format('{{value|rightalign:2}}', {value: 2743})).to.be.equal('2743');
    });

    it('should colorize output', function() {
        var str = cplate.format('{{value|colorize:green|colorize:underline}}', {value: 43});
        console.log('\tColorized Meaning of Life + 1? = ' + str);

        str = cplate.format('{{value|colorize:yellow:underline}}', {value: 43});
        console.log('\tColorized Meaning of Life + 1? = ' + str);

        var array = cplate.formatArray([
            '\t{{info|colorize:info}}',
            '\t{{warn|colorize:warn}}',
            '\t{{debug|colorize:debug}}',
            '\t{{error|colorize:error|colorize:underline}}',
            '\t{{level|colorize}}'
        ], {
            info: 'info',
            warn: 'warn',
            debug: 'debug',
            error: 'error',
            level: 'info',
            theme: {
                info: 'yellow',
                warn: 'green',
                debug: 'magenta',
                error: 'grey'
            }
        });
        _.forEach(array, function(value) {
            console.log(value);
        });
    });

    it('should capitalize output', function () {
        expect(cplate.format('{{value|capitalize}}', {value: 'inge'})).to.be.equal('Inge');
    });

    it('should camelcase output', function () {
        expect(cplate.format('{{value|camelcase}}', {value: 'inge-world'})).to.be.equal('IngeWorld');
    });

    it('should uppercase output', function () {
        expect(cplate.format('{{value|uppercase}}', {value: 'inge'})).to.be.equal('INGE');
    });

    it('should format datetime', function () {
        var date = new Date('2014-08-31 00:05:27');
        expect(cplate.format('{{value|datetime}}', {value: date})).to.be.equal('August 31st 2014, 00:05:27');
        expect(cplate.format('{{value|datetime:DD. MMMM YYYY HH:mm:ss}}', {value: date})).to.be.equal('31. August 2014 00:05:27');
    });

    it('should finalize output', function () {
        cplate.registerFilter('transformer', function (value) {
            if (value) {
                return JSON.stringify(value);
            }
        })
        .registerFilter('finalizer', function (value) {
            return value.toString().split('').reverse().join('');
        });
        expect(cplate.format('{{value|uppercase}}', {value: '$inge'})).to.be.deep.equal(JSON.stringify('EGNI$'));
        cplate.unregisterFilter('finalizer');
        expect(cplate.format('{{value}}', {value: {}})).to.be.deep.equal(JSON.stringify({}));
    });
});

describe('CPlate:CustomDelimiter', function () {
    it('should work with "<%= . : %>"', function () {
        var cplate = new CPlate({delimiter: '<%= . : %>'});
        console.log(cplate.format('\tThe Meaning of Life = <%= level.colorize: grey %>!', {level: 42}));
    });

    it('should work with "% | : %"', function () {
        var cplate = new CPlate({delimiter: '% | : %'});
        console.log(cplate.format('\tThe Meaning of Life = %inge|colorize:yellow%!', {inge: 'Inge'}));
        console.log(cplate.format('\tThe Meaning of DateTime = %inge|datetime:HH:mm:ss|colorize:red%!', {inge: new Date()}));
    });
});

describe('CPlate:Compile', function () {
    var filename = __dirname + '/test.tpl';

    beforeEach(function () {
        fs.writeFileSync(filename, '{{value|uppercase}}', {encoding: 'utf-8'});
    });

    afterEach(function () {
        fs.unlinkSync(filename);
    });

    it('should compile template from file using cache', function (done) {
        var cplate = new CPlate();
        cplate.compile(filename, {value: 'inge'})
        .then(function (text) {
            expect(cplate.cache).to.have.property(filename, '{{value|uppercase}}');
            expect(text).to.be.equal('INGE');

            cplate.compile(filename, {value: 'egni'})
            .then(function (text) {
                expect(cplate.clear()).to.have.property('cache').that.deep.equals({});
                expect(text).to.be.equal('EGNI');
                done();
            })
            .catch(function (err) {
                done(new Error(err));
            })
            .done();
        })
        .catch(function (err) {
            done(new Error(err));
        })
        .done();
    });
});
