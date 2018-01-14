var _ = require('lodash')
    , fs = require('fs')
    , path = require('path')
    , yaml = require('js-yaml')
    , EventEmitter = require('events').EventEmitter
    , inherits = require('util').inherits
    , deep = require('./util').deep
    , Watcher = require('./util').Watcher;

/**
 * CConf - A configuration store.
 * @constructor
 * @param {string} name (optional) - An internal identifier.
 * @param {array} required (optional) - An array of strings, representing a list of required keys.
 * @param {object} defaults (optional) - An object, holding default values for the required keys.
 * @example
 * var CConf = require('node-cconf')
 *     , http = require('http');
 *
 * // Create a new configuration named 'server', width required 'port' and its default value '3000'.
 * // Then parse ARGV array; looking for '--port=value' and set this value as configuration value.
 * var conf = new CConf('server', ['port'], {port: 3000}).load(process.argv);
 *
 * // Create a new http-server, listen on configured port.
 * var server = http.createServer().listen(conf.getValue('port'));
 */
function CConf(name, required, defaults) {
    this.name = name || 'NO-NAME';

    this.required = required || [];
    this.defaults = defaults || {};
    this.config = {};
    this.watchers = [];
    this.filename = null;

    EventEmitter.call(this);
}

/**
 * @event CConf#requiredchanged
 * @property {array} diff - A list of added/removed keys.
 * @property {array} oldValue - The list of keys, before changes were applied.
 * @description This event is fired by a {@link Watcher} on required keys changes.
 */
/**
 * @event CConf#defaultchanged:key
 * @property {*} newValue - The default value for a key after changing.
 * @property {*} oldValue - The default value for a key before changing.
 * @description This event is fired by a {@link Watcher} on defaults changes.
 * The appropriate {@link Watcher} is automatically added, when a new default
 * key/value is added (see {@link CConf.setDefault}). The event name is composed
 * of the string 'defaultchanged' and the configuration key, separated by a
 * colon (e.g. 'defaultchanged:server:port').
 * @example var conf = new CConf().on('defaultchanged:server:port', function(newValue, oldValue) {
 *      console.log('old default server-port:', oldValue);
 *      console.log('new default server-port:', newValue);
 * });
 */
/**
 * @event CConf#valuechanged:key
 * @property {*} newValue - The value for a key after changing.
 * @property {*} oldValue - The value for a key before changing.
 * @description This event is fired by a {@link Watcher} on value changes.
 * The appropriate {@link Watcher} is automatically added, when a new
 * key/value is set (see {@link CConf.setValue}). The event name is composed
 * of the string 'valuechanged' and the configuration key, separated by a
 * colon (e.g. 'valuechanged:server:port').
 * @example var conf = new CConf().on('valuechanged:server:port', function(newValue, oldValue) {
 *      console.log('old server-port:', oldValue);
 *      console.log('new server-port:', newValue);
 * });
 */
inherits(CConf, EventEmitter);

/**
 * @method CConf.addWatcher
 * @param {function} watcher (optional) - An instance of {@link Watcher}.
 * @returns {object} this
 * @description Register an instance of {@link Watcher} to observe value changes.
 * If a watcher with same id is registered already, the previous one will be
 * removed first. If called with no parameters, this method registers the default
 * watcher for observe changes on the required keys list.
 * This emits {@emits CConf#requiredchanged}, which can be listen on.
 */
CConf.prototype.addWatcher = function(watcher) {
    if (watcher) {
        this.removeWatchers(watcher.id).watchers.push(watcher);
    } else {
        this.removeWatchers('required').watchers.push(
            new Watcher('required').watch(this.required, function(newValue, oldValue) {
                var diff = null;
                if (newValue.length > oldValue.length) {
                    diff = _.difference(newValue, oldValue);
                } else {
                    diff = _.difference(oldValue, newValue);
                }

                this.emit('requiredchanged', diff, newValue);
            }, this)
        );
    }

    return this;
};

/**
 * @method CConf.removeWatchers
 * @param {string|number} id (optional) - An internal identifier representing a {@link Watcher}.
 * @return {object} this
 * @description Unregister a given {@link Watcher} or all watchers, when called with no arguments.
 */
CConf.prototype.removeWatchers = function(id) {
    _.forEach(this.watchers, function(watcher) {
        if (!id || watcher.id === id) {
            if (_.isFunction(watcher.unwatch)) {
                watcher.unwatch();
            }
        }
    });

    return this;
};

/**
 * @method CConf.set
 * @private
 * @param {object} obj - The object which holds the key/value to set.
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * @param {*} value - The value of the given key.
 * @return {object|undefined}
 * @description Set a key/value in an object. This one is used internally.
 */
CConf.prototype.set = function(obj, key, value) {
    if (obj && _.isString(key)) {
        return _.merge(obj, deep.set(key, value, ':'), function(objValue, srcValue) {
            if (_.isArray(srcValue)) {
                return srcValue;
            }

            return undefined;
        });
    }

    return undefined;
};

/**
 * @method CConf.get
 * @private
 * @param {object} obj - The object which holds the key/value to set.
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * @return {*}
 * @description Get a key/value in an object. This one is used internally.
 */
CConf.prototype.get = function(obj, key) {
    if (obj && _.isString(key)) {
        return deep.get(obj, key, ':');
    }

    return undefined;
};

/**
 * @method CConf.addRequired
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * @return {object} this
 * @description Add a required key to the configuration. This key must have
 * a value on loading and saving to be valid. See {@link CConf.setDefault|default values}.
 */
CConf.prototype.addRequired = function(key) {
    if (_.isString(key)) {
        var keys = this.required;
        if (_.indexOf(keys, key) === -1) {
            keys.push(key);
            this.required = keys.sort();
        }
    }

    return this;
};

/**
 * @method CConf.removeRequired
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * @return {object} this
 * @description Remove a required key from the configuration.
 */
CConf.prototype.removeRequired = function(key) {
    if (_.isString(key)) {
        var keys = this.required;
        if (_.indexOf(keys, key) > -1) {
            this.required = keys.filter(function(item) {
                return item !== key;
            });
        }
    }

    return this;
};

/**
 * @method CConf.setDefault
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * If key is an object, it will merged with set defaults. So multiple default
 * values can be set.
 * @param {*} value - The value of the given key.
 * @description Set the default value for a key and add a {@link Watcher} to
 * observe this value for changes. If a key is required for loading and saving
 * and its value is not set, this default value will be used.
 */
CConf.prototype.setDefault = function(key, value) {
    var defaults = this.defaults;

    if (_.isString(key)) {
        var id = 'defaultchanged:' + key;
        this.removeWatchers(id).addWatcher(deep.watch(id, this.defaults, key, ':', function(newValue, oldValue) {
            this.emit(id, newValue, oldValue);
        }, this));

        this.set(defaults, key, value);
    }

    if (_.isPlainObject(key)) {
        this.defaults = _.merge(defaults, key, function(objValue, srcValue) {
            if (_.isArray(srcValue)) {
                return srcValue;
            }

            return undefined;
        });
    }

    return this;
};

/**
 * @method CConf.getDefault
 * @param {string} key (optional) - An identifier. Nested keys can be 'colon-separated'.
 * @return {*}
 * @description Get the default value for a given key or all default values, when called
 * without arguments.
 */
CConf.prototype.getDefault = function(key) {
    if (_.isString(key)) {
        return this.get(this.defaults, key);
    } else {
        return this.defaults;
    }

    return undefined;
};

/**
 * @method CConf.execOptions
 * @private
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * @param {*} value - The value of the given key.
 * @param {object} options - Valid options are 'resetToDefault' and 'resolvePath'
 * (both boolean). The latter tries to resolve a given path value relative to the
 * applications working directory.
 * @return {*}
 * @description This method transforms values after rules specified in the given options.
 * It is used internally on {@link CConf.setValue} and {@link CConf.getValue}.
 */
CConf.prototype.execOptions = function(key, value, options) {
    if (_.isPlainObject(options)) {
        if(options.hasOwnProperty('resetToDefault') && options.resetToDefault) {
            value = this.get(this.defaults, key);
        }

        if (options.hasOwnProperty('resolvePath') && options.resolvePath) {
            var argv = process.argv.filter(function(arg) {
                return !arg.match(/^-/);
            });

            value = path.resolve(path.dirname(argv[argv.length - 1]), value);
        }
    }

    return value;
};

/**
 * @method CConf.setValue
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * @param {*} value - The value of the given key.
 * @param {object} options (optional) - Valid options are 'resetToDefault' and 'resolvePath'
 * (both boolean). The latter tries to resolve a given path value relative to the
 * applications working directory.
 * @return {*}
 * @description Set a value for a given key.
 * @example
 * var conf = new CConf().setValue('http:port', 3000);
 */
CConf.prototype.setValue = function(key, value, options) {
    var config = this.config;

    if (_.isString(key)) {
        if (_.isUndefined(value)) {
            value = this.getDefault(key);
        }

        var id = 'valuechanged:' + key;
        this.removeWatchers(id).addWatcher(deep.watch(id, this.config, key, ':', function(newValue, oldValue) {
            this.emit(id, newValue, oldValue);
        }, this));

        value = this.execOptions(key, value, options);
        this.set(config, key, value);
    }

    return this;
};

/**
 * @method CConf.getValue
 * @param {string} key - An identifier. Nested keys can be 'colon-separated'.
 * @param {object} options (optional) - Valid options are 'resetToDefault' and 'resolvePath'
 * (both boolean). The latter tries to resolve a given path value relative to the
 * applications working directory.
 * @return {*}
 * @description Get the value for a given key.
 * @example
 * var conf = new CConf().setValue('https:port', 3000);
 *
 * conf.getValue('https:port'); // returns 3000
 */
CConf.prototype.getValue = function(key, options) {
    if (_.isString(key)) {
        var value = this.get(this.config, key);
        if (_.isUndefined(value)) {
            value = this.getDefault(key);
        }
        return this.execOptions(key, value, options);
    }

    return undefined;
};

/**
 * @method CConf.getObject
 * @param {array} keys - A list of keys from which values will be returned.
 * @param {object} options - See {@link CConf.getValue}.
 * @return {object} - A merged object with all keys and their values.
 * @description This method constructs an object from values of a list with
 * stored keys.
 */
CConf.prototype.getObject = function(keys, options) {
    if (_.isArray(keys)) {
        var result = {};

        _.forEach(keys, function (key) {
            var obj = deep.set(key, CConf.prototype.getValue.call(this, key, options), ':');
            result = _.merge(result, obj);
        }, this);

        return result;
    }

    return undefined;
};

/**
 * @method CConf.load
 * @param {object|array|function|string} source - The source to load configuration from.
 * @return {object} this
 * @description If source is an object or a function which returns an object, this
 * object is taken as configuration. If source is a string which represents a valid
 * filename, the configuration is taken from this file. Supported filetypes are
 * JSON (*.json) and YAML (*.yml/*.yaml).
 * If source is an ARGV array, this array is filtered for items of type '--key=value',
 * '-key=value' or '--key:subkey=value'.
 * @example
 * // Load configuration values from YAML file and merge then with application arguments.
 * var conf = new CConf('server', ['port']).load('server.yml').load(process.argv);
 */
CConf.prototype.load = function(source) {
    var self = this;

    function loadFromFile(filename) {
        try {
            if (filename.match(/.*\.json$/)) {
                return JSON.parse(fs.readFileSync(filename, {encoding: 'utf8'}));
            } else if (filename.match(/.*\.y(a|)ml$/)) {
                return yaml.safeLoad(fs.readFileSync(filename, {encoding: 'utf8'}));
            } else {
                throw new Error('Unsupported filetype for loading configuration from: "' + filename + '"!');
            }
        } catch (err) {
            throw new Error('Cannot load configuration file "' + filename + '"!');
        } finally {
            self.filename = filename;
        }
    }

    function loadFromArray(source) {
        var keyValues = {};
        _.forEach(source, function(param) {
            if (param[0] === '-') {
                while(param[0] === '-') {
                    param = param.slice(1);
                }
                param = param.split(param.match(/=|\ /));

                var key = param[0]
                    , value;
                if (param.length === 2) {
                    value = _.parseInt(param[1]);
                    if (_.isNaN(value)) {
                        value = param[1];
                    }
                } else {
                    value = true;
                }

                this.set(keyValues, key, value);
            }
        }, this);

        return keyValues;
    }

    function loadFromObject(source) {
        var defaultKeyValues = deep.keyValues(this.defaults, ':');
        _.forEach(defaultKeyValues, function(keyValue) {
            this.setValue(keyValue.key, keyValue.value);
        }, this);

        var keyValues = deep.keyValues(source, ':');
        _.forEach(keyValues, function(keyValue) {
            this.setValue(keyValue.key, keyValue.value);
        }, this);

        _.forEach(this.required, function(key) {
            if (_.isUndefined(this.getValue(key))) {
                throw new Error('Configuration value for "' + key + '" is undefined but required!');
            }
        }, this);
    }

    var boundLoadFromObject = _.bind(loadFromObject, this);

    switch (typeof source) {
        case 'undefined':
            if (self.filename) {
                self.load(filename);
            } else {
                throw new TypeError('Undefined source!');
            }
            break;
        case 'string':
            _.compose(boundLoadFromObject, loadFromFile)(source);
        break;
        case 'function':
            _.compose(boundLoadFromObject, source)();
        break;
        case 'object':
            if (_.isArray(source)) {
                var boundLoadFromArray = _.bind(loadFromArray, this);
                _.compose(boundLoadFromObject, boundLoadFromArray)(source);
            } else {
                boundLoadFromObject(source);
            }
        break;
        default:
            throw new Error('Unsupported source: "' + source + '"!');
    }

    return this;
};

/**
 * @method CConf.save
 * @param {function|string} target (optional) - The target to store configuration in.
 * @param {boolean} validate (optional) - If set to true, the configuration is checked
 * against all required keys and their values.
 * @return {object|*|boolean}
 * @description If target is a function which takes an object as argument, this function
 * is applied when storing the configuration and their return value is returned by {@link CConf.save}.
 * If target is a string which represents a filename, the configuration is stored in this file.
 * Supported filetypes are JSON (*.json) and YAML (*.yml/*.yaml). If the file was created
 * successfully the save method returns 'true'.
 * @example
 * // Load configuration values from JSON document.
 * var conf = new CConf().load('server.json');
 *
 * // Save configuration when application exits.
 * process.on('exit', function() {
 *      conf.save('server.yaml');
 * }
 */
CConf.prototype.save = function(target, validate) {
    var self = this;

    function saveToFile(filename, source) {
        try {
            if (filename.match(/.*\.json$/)) {
                fs.writeFileSync(filename, JSON.stringify(this.config), {encoding: 'utf8'});
                return true;
            } else if (filename.match(/.*\.y(a|)ml$/)) {
                fs.writeFileSync(filename, yaml.safeDump(this.config), {encoding: 'utf8'});
                return true;
            } else {
                throw new Error('Unsupported filetype for saving configuration to: "' + filename + '"!');
            }
        } catch (err) {
            throw new Error('Cannot save configuration file "' + filename + '"!');
        }
    }

    function saveToObject(validate) {
        if (validate) {
            _.forEach(this.required, function(key) {
                if (_.isUndefined(this.getValue(key))) {
                    throw new Error('Configuration value for "' + key + '" is undefined but required!');
                }
            }, this);
        }

        return _.merge(this.defaults, this.config, function(objValue, srcValue) {
            if (_.isArray(srcValue)) {
                return srcValue;
            }

            return undefined;
        });
    }

    var boundSaveToObject = _.bind(saveToObject, this, validate);

    switch (typeof target) {
        case 'undefined':
            if (self.filename) {
                return self.save(self.filename);
            } else {
                return boundSaveToObject();
            }
        case 'string':
            var boundSaveToFile = _.bind(saveToFile, this, target);
            return _.compose(boundSaveToFile, boundSaveToObject)();
        case 'function':
            return _.compose(target, boundSaveToObject)();
        default:
            return boundSaveToObject();
    }
};

/**
 * @method CConf.parseEnv
 * @param {object} env - An object like 'process.env' (which is default).
 * @return {object} this
 * @description Search the environment for config key/value pairs.
 * Configuration-keys in form of 'key:subkey' will be 'KEY_SUBKEY' in
 * environment. Environment-values in form of 'KEY_SUBKEY=valueA,valueB,valueC'
 * will transformed to an array '["valueA", "valueB", "valueC"]'.
 */
CConf.prototype.parseEnv = function(env) {
    env = env || process.env;

    if (_.isObject(env)) {
        _.forEach(this.required, function(required) {
            var key = required.replace(':', '_').toUpperCase()
                , value = env[key];

            if (_.isString(value)) {
                if (_.indexOf(value, ',') > -1) {
                    value = value.split(',').map(function(value) {
                        return value.trim();
                    });
                }
                this.setValue(required, value);
            }
        }, this);
    } else {
        throw new TypeError('Environment argument must be an object!');
    }

    return this;
};

module.exports = CConf;
