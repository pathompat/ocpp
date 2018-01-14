var _ = require('lodash')
    , expect = require('chai').expect
    , util = require('../index').util;

describe('util.deep', function() {
    it('get and set should be defined', function() {
        expect(util.deep.get).to.be.a.function;
        expect(util.deep.set).to.be.a.function;
    });

    it('should return undefined on set with invalid parameters', function() {
        expect(util.deep.set('key')).to.be.undefined;
        expect(util.deep.set(null, 43)).to.be.undefined;
    });

    it('should set an object', function() {
        expect(util.deep.set('key', 43)).to.be.deep.equal({key: 43});
    });

    it('should set a deep object', function() {
        expect(util.deep.set('key.param', 43)).to.be.deep.equal({key: {param: 43}});
    });

    it('should set a deep object with custom path separator', function() {
        expect(util.deep.set('key:param', 43, ':')).to.be.deep.equal({key: {param: 43}});
    });

    it('should return undefined on get with invalid parameters', function() {
        expect(util.deep.get({key: 43})).to.be.undefined;
        expect(util.deep.get(null, 'key')).to.be.null;
        expect(util.deep.get({}, 'key')).to.be.undefined;
        expect(util.deep.get({key: 43}, 'key.param')).to.be.undefined;
    });

    it('should get an object', function() {
        expect(util.deep.get({key: 43}, 'key')).to.be.equal(43);
    });

    it('should get a deep object', function() {
        expect(util.deep.get({key: {param: 43}}, 'key.param')).to.be.equal(43);
    });

    it('should get a deep object with custom path separator', function() {
        expect(util.deep.get({key: {param: 43}}, 'key:param', ':')).to.be.equal(43);
    });

    it('should transforms an object to its string representation', function() {
        expect(util.deep.keys({
            key: {
                paramA: 27,
                paramB: {
                    subkeyB: {
                        valueA: 43
                    }
                },
                paramC: {
                    valueD: 24
                }
            }
        })).to.be.deep.equal([
            'key.paramA',
            'key.paramB.subkeyB.valueA',
            'key.paramC.valueD'
        ]);

        expect(util.deep.keys({
            key: {
                param: 27
            }
        }, ':')).to.be.deep.equal(['key:param']);

        expect(util.deep.keys({paramB: 27}, ':')).to.be.deep.equal(['paramB']);
    });

    it('should transforms an object to its string representation including values', function() {
        expect(util.deep.keyValues({
            key: {
                paramA: 27,
                paramB: {
                    subkeyB: {
                        valueA: 43
                    }
                },
                paramC: {
                    valueD: 24
                }
            }
        })).to.be.deep.equal([
            {key: 'key.paramA', value: 27},
            {key: 'key.paramB.subkeyB.valueA', value: 43},
            {key: 'key.paramC.valueD', value: 24}
        ]);
    });
});

describe('util.Watcher', function() {
    it('should instanciates', function() {
        expect(new util.Watcher()).to.be.an.instanceof(util.Watcher);
    });

    it('should watches for changes for a given function', function(done) {
        var keys = ['keyA', 'keyB'];

        var context = this;
        var watcher = new util.Watcher().watch(function() {
            return keys.length;
        }, function(newValue, oldValue) {
            expect(oldValue).to.be.equal(2);
            expect(newValue).to.be.equal(3);
            expect(this).to.be.equal(context);
            done();
        }, context);

        keys.push('keyC');
        setTimeout(watcher.unwatch, 1000);
    });

    it('should watches for changes for a given object', function(done) {
        var keys = ['keyA', 'keyB'];

        var context = this;
        var watcher = new util.Watcher().watch(keys, function(newValue, oldValue) {
            expect(oldValue).to.be.deep.equal(['keyA', 'keyB']);
            expect(newValue).to.be.deep.equal(['keyA', 'keyB', 'keyC']);
            expect(this).to.be.equal(context);
            done();
        }, context);

        keys.push('keyC');
        setTimeout(watcher.unwatch, 1000);
    });

    it('should deep watch for changes for a given path', function(done) {
        var obj = {keyB: {subkeyC: 27}};

        var context = this;
        var unwatch = util.deep.watch('testWatcher', obj, 'keyB:subkeyC', ':', function(newValue, oldValue) {
            expect(oldValue).to.be.equal(27);
            expect(newValue).to.be.equal(43);
            expect(this).to.be.equal(context);
            done();
        }, context).unwatch;

        obj.keyB.subkeyC = 43;
        setTimeout(unwatch, 1000);
    });
});
