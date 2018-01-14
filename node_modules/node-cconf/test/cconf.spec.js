var _ = require('lodash')
    , chai = require('chai')
    , spies = require('chai-spies')
    , expect = chai.expect
    , fs = require('fs')
    , path = require('path')
    , yaml = require('js-yaml')
    , CConf = require('../index');

chai.use(spies);

describe('CConf', function() {
    it('should instanciates', function() {
        var conf = new CConf();
        expect(conf).to.be.an.instanceof(CConf);
        expect(conf.name).to.be.equal('NO-NAME');
        expect(conf.required).to.be.deep.equal([]);
        expect(conf.defaults).to.be.deep.equal({});
        expect(conf.config).to.be.deep.equal({});
    });

    it('should instanciates with parameters', function() {
        var conf = new CConf('testC', ['keyA', 'keyB:subkeyA'], {keyA: 43, keyB: {subkeyA: 27}});
        expect(conf).to.be.an.instanceof(CConf);
        expect(conf.name).to.be.equal('testC');
        expect(conf.required).to.be.deep.equal(['keyA', 'keyB:subkeyA']);
        expect(conf.defaults).to.be.deep.equal({keyA: 43, keyB: {subkeyA: 27}});
        expect(conf.config).to.be.deep.equal({});
    });

    it('should adds required keys', function() {
        var conf = new CConf('testC', ['keyA']).addRequired('keyA').addRequired('keyB');
        expect(conf.required).to.be.deep.equal(['keyA', 'keyB']);
    });

    it('should removes required keys', function() {
        var conf = new CConf('testC', ['keyA', 'keyB']).removeRequired('keyA');
        expect(conf.required).to.be.deep.equal(['keyB']);
    });

    it('should sets defaults with given key/value', function() {
        var conf = new CConf().setDefault('keyB:subkeyC', 27);
        expect(conf.defaults).to.be.deep.equal({keyB: {subkeyC: 27}});
    });

    it('should sets defaults with given object', function() {
        var conf = new CConf().setDefault({keyB: {subkeyC: 27}});
        expect(conf.defaults).to.be.deep.equal({keyB: {subkeyC: 27}});
    });

    it('should gets default value with given key', function() {
        var conf = new CConf().setDefault({keyB: {subkeyC: 27}});
        expect(conf.getDefault('keyB:subkeyC')).to.be.equal(27);
        expect(conf.getDefault('keyC:subkeyC')).to.be.undefined;
    });

    it('should sets a value with given key', function() {
        var conf = new CConf().setValue('keyB:subkeyC', 27);
        expect(conf.config).to.be.deep.equal({keyB: {subkeyC: 27}});
    });

    it('should sets a value with given key and options', function() {
        var conf = new CConf().setDefault('keyB:subkeyC', 27).setValue('keyB:subkeyC', 43, {resetToDefault: true});
        expect(conf.config).to.be.deep.equal({keyB: {subkeyC: 27}});
    });

    it('should gets a value with given key', function() {
        var conf = new CConf().setValue('keyB:subkeyC', 27);
        expect(conf.getValue('keyB:subkeyC')).to.be.equal(27);
    });

    it('should gets a value with given key and options', function() {
        var conf = new CConf().setValue('keyB:subkeyC', 'test.json');
        expect(conf.getValue('keyB:subkeyC', {resolvePath: true})).to.be.equal(__dirname + '/test.json');
    });

    it('should gets all subkey/values with given key', function() {
        var conf = new CConf().setValue('keyB:subkeyC', 27).setValue('keyB:subkeyD', 43);
        expect(conf.getValue('keyB')).to.be.deep.equal({subkeyC: 27, subkeyD: 43});
    });

    it('should gets all subkey/values from defaults', function() {
        var conf = new CConf().setDefault('keyB:subkeyC', 27).setDefault('keyB:subkeyD', 43);
        expect(conf.getValue('keyB')).to.be.deep.equal({subkeyC: 27, subkeyD: 43});
    });

    it('should get values from a list of keys', function () {
        var conf = new CConf().setDefault('keyB:subkeyC', 27).setDefault('keyB:subkeyD', 43).setDefault('keyA', 9);
        expect(conf.getObject(['keyA', 'keyB'])).to.be.deep.equal({keyA: 9, keyB: {subkeyC: 27, subkeyD: 43}});
    });
});

describe('CConf: events', function() {
    it('should emits event on changing required keys', function(done) {
        var conf = new CConf().addRequired('keyA').addRequired('keyB');

        function onrequiredchanged(diff, newValue) {
            expect(diff).to.be.deep.equal(['keyC']);
            expect(newValue).to.be.deep.equal(['keyA', 'keyB', 'keyC']);
            expect(this).to.be.equal(conf);
        }
        var spy = chai.spy(onrequiredchanged);
        conf.on('requiredchanged', spy);

        conf.addWatcher().addRequired('keyC');
        setTimeout(function() {
            expect(spy).to.have.been.called.once;
            done();
        }, 1000);
    });

    it('should emits event on changing default values', function(done) {
        var conf = new CConf().setDefault('keyB:paramC', 43);

        function ondefaultchanged(newValue, oldValue) {
            expect(newValue).to.be.equal(24);
            expect(oldValue).to.be.equal(43);
            expect(this).to.be.equal(conf);
        }
        var spy = chai.spy(ondefaultchanged);
        conf.on('defaultchanged:keyB:paramC', spy);

        conf.setDefault('keyB:paramC', 24);
        setTimeout(function() {
            expect(spy).to.have.been.called.once;
            done();
        }, 1000);
    });

    it('should emits event on changing values', function(done) {
        var conf = new CConf().setValue('keyB:paramC', 43);

        function onvaluechanged(newValue, oldValue) {
            expect(newValue).to.be.equal(24);
            expect(oldValue).to.be.equal(43);
            expect(this).to.be.equal(conf);
        }
        var spy = chai.spy(onvaluechanged);
        conf.on('valuechanged:keyB:paramC', spy);

        conf.setValue('keyB:paramC', 24);
        setTimeout(function() {
            expect(spy).to.have.been.called.once;
            done();
        }, 1000);
    });
});

describe('CConf: load', function() {
    it('should load from object', function() {
        expect(new CConf().load({keyB: {paramC: 43}}).getValue('keyB:paramC')).to.be.equal(43);
    });

    it('should load a number and a switch from ARGV array', function() {
        var argv = ['node', '--keyB:paramC=43', '-keyB:paramD'];
        expect(new CConf().load(argv).getValue('keyB')).to.be.deep.equal({paramC: 43, paramD: true});
    });

    it('should load a value from ARGV array', function () {
        var argv = ['node', '--keyB:paramC=config.yml'];
        expect(new CConf().load(argv).getValue('keyB')).to.be.deep.equal({paramC: 'config.yml'});
    });

    it('should load from JSON file', function() {
        var filename = __dirname + '/testFile.json';
        fs.writeFileSync(filename, JSON.stringify({keyB: {paramC: 43}}), {encoding: 'utf8'});
        expect(new CConf().load(filename).getValue('keyB:paramC')).to.be.equal(43);
        fs.unlinkSync(filename);
    });

    it('should load from YAML file', function() {
        var filename = __dirname + '/testFile.yml';
        fs.writeFileSync(filename, yaml.safeDump({keyB: {paramC: 43}}), {encoding: 'utf8'});
        expect(new CConf().load(filename).getValue('keyB:paramC')).to.be.equal(43);
        fs.unlinkSync(filename);
    });

    it('should load object from custom function', function() {
        expect(new CConf().load(function() { return {keyB: {paramC: 43}}; }).getValue('keyB:paramC')).to.be.equal(43);
    });

    it('should use defaults if value not set on loading', function() {
        var conf = new CConf().setDefault('keyB:paramC', 27).load({});
        expect(conf.getValue('keyB:paramC')).to.be.equal(27);
    });

    it('should throw an error if value is required and not set', function() {
        try {
            new CConf().addRequired('keyB:paramC').load({});
        } catch (err) {
            expect(err.message).to.match(/keyB:paramC/);
        }
    });

    it('should parse the environment', function() {
        var conf = new CConf().addRequired('keyB:paramC').parseEnv();
        expect(conf.getValue('keyB:paramC')).to.be.deep.equal(['valueA', 'valueB', 'valueC']);
    });

    it('should load from object with empty object values', function () {
        var conf = new CConf('inge', ['supported-roles']).load({'supported-roles': {publisher: {}}});
        expect(conf.getValue('supported-roles')).to.be.deep.equal({publisher: {}});
    });
});

describe('CConf: save', function() {
    it('should save to an object', function() {
        expect(new CConf().setValue('keyB:paramC', 27).save()).to.be.deep.equal({keyB: {paramC: 27}});
    });

    it('should save to a JSON file', function() {
        var filename = __dirname + '/testFile.json';
        expect(new CConf().setValue('keyB:paramC', 27).save(filename)).to.be.true;
        expect(JSON.parse(fs.readFileSync(filename, {encoding: 'utf8'}))).to.be.deep.equal({keyB: {paramC: 27}});
        fs.unlinkSync(filename);
    });

    it('should save to a YAML file', function() {
        var filename = __dirname + '/testFile.yml';
        expect(new CConf().setValue('keyB:paramC', 27).save(filename)).to.be.true;
        expect(yaml.safeLoad(fs.readFileSync(filename, {encoding: 'utf8'}))).to.be.deep.equal({keyB: {paramC: 27}});
        fs.unlinkSync(filename);
    });

    it('should save to same file where loaded from', function () {
        var filename = __dirname + '/testFile.yml';
        var conf = new CConf().setValue('keyB:paramC', 27);
        expect(conf.save(filename)).to.be.true;
        conf.load(filename);
        fs.unlinkSync(filename);
        expect(fs.existsSync(filename)).to.be.false;
        expect(conf.getValue('keyB:paramC')).to.be.equal(27);
        expect(conf.save()).to.be.true;
        expect(fs.existsSync(filename)).to.be.true;
        fs.unlinkSync(filename);
    });

    it('should save to a custom function', function() {
        function save(obj) {
            expect(obj).to.be.deep.equal({keyB: {paramC: 27}});
            return true;
        }
        var spy = chai.spy(save);
        expect(new CConf().setValue('keyB:paramC', 27).save(spy)).to.be.true;
        expect(spy).to.have.been.called.once;
    });

    it('should use defaults if value is not set', function() {
        var conf = new CConf().addRequired('keyB:paramC').setDefault('keyB:paramC', 27);
        expect(conf.save(null, true)).to.be.deep.equal({keyB: {paramC: 27}});
    });

    it('should throw an error if value is required and not set', function() {
        try {
            new CConf().addRequired('keyB:paramC').save(null, true);
        } catch (err) {
            expect(err.message).to.match(/keyB:paramC/);
        }
    });
});
