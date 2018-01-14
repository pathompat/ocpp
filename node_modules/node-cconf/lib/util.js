var _ = require('lodash');

/**
 * @namespace deep
 * @description A collection of methods for working with objects recursive.
 */
var deep = {
    /**
     * method deep.get
     * @param {object} obj - The object holding the value.
     * @param {string} path - The path in the object to the value.
     * @param {string} sep - The path-separator.
     * @return {*}
     * @description Traverse an object by path to get a value.
     * @example deep.get({key: {subkey: 27}}, 'key:subkey', ':') // returns 27
     */
    get: function (obj, path, sep) {
        if (_.isUndefined(obj) || !(_.isString(path) || _.isArray(path))) {
            return undefined;
        }

        sep = sep || '.';
        if (_.isString(path)) {
            path = path.split(sep);
        }

        var key = path.shift();
        if (obj && key) {
            obj = obj[key];
        } else {
            return obj;
        }

        return this.get(obj, path, sep);
    },
    /**
     * @method deep.set
     * @param {string} path - The path in the object to the value.
     * @param {*} value - The value of the object in place of the path.
     * @param {string} sep - The path-separator.
     * @return {object}
     * @description Construct an object by given path and value.
     * @example deep.set('key:subkey', 27, ':') // returns {key: {subkey: 27}}
     */
    set: function(path, value, sep) {
        if (!(_.isString(path) || _.isArray(path)) || _.isUndefined(value)) {
            return undefined;
        }

        if (_.isString(path)) {
            sep = sep || '.';
            path = path.split(sep);
        }
        var current = {};

        var key = path.pop();
        if (key) {
            current[key] = value;
        } else {
            return value;
        }

        return this.set(path, current, sep);
    },
    /**
     * @method deep.traverse
     * @param {object} obj
     * @param {function} fn
     * @param {string} sep
     * @param {object} parent
     * @description Internally used for collecting all keys of an object.
     */
    traverse: function(obj, fn, sep, parent) {
        sep = sep || '.';

        _.forOwn(obj, function(value, key, obj) {
            fn.apply(this, [key, value, parent]);
            if (!_.isUndefined(parent)) {
                key = [parent, key].join(sep);
            }

            if (_.isPlainObject(value)) {
                this.traverse(value, fn, sep, key);
            }
        }, this);
    },
    /**
     * @method deep.keys
     * @param {object} obj - The object holding the keys.
     * @param {string} sep - The path-separator.
     * @return {array}
     * @description Returns an array with all keys of an object.
     * These keys are strings, separated by the value of the separator argument.
     */
    keys: function(obj, sep) {
        sep = sep || '.';

        var paths = [];
        this.traverse(obj, function(key, value, parent) {
            if (!_.isPlainObject(value)) {
                if (_.isUndefined(parent)) {
                    paths.push(key);
                } else {
                    paths.push([parent, key].join(sep));
                }
            }
        }, sep);

        return paths;
    },
    /**
     * @method deep.keyValues
     * @param {object} obj - The object holding the keys.
     * @param {string} sep - The path-separator.
     * @return {array}
     * @description Returns an array of objects with all key/values of an given object.
     * The keys of these returned objects are strings, separated by the value of the
     * separator argument.
     */
    keyValues: function(obj, sep) {
        sep = sep || '.';

        var paths = [];
        this.traverse(obj, function(key, value, parent) {
            if (!_.isPlainObject(value) || (_.isPlainObject(value) && !_.keys(value).length)) {
                if (_.isUndefined(parent)) {
                    paths.push({key: key, value: value});
                } else {
                    paths.push({key: [parent, key].join(sep), value: value});
                }
            }
        }, sep);

        return paths;
    },
    /**
     * @method deep.watch
     * @param {string|number|null} id - An identifier, represents the watcher.
     * @param {object} obj - An object, which should be observed.
     * @param {string} path - The path in the object to the value.
     * @param {string} sep (optional) - The path-separator.
     * @param {function} callback - A callback, which can be executed.
     * @param {object} context (optional) - A context, in which the callback is executed.
     * @return {object} - An instance of {@link Watcher}.
     * @description This method simply creates a new Watcher for observing an object on
     * given path for value changes.
     */
    watch: function(id, obj, path, sep, callback, context) {
        var self = this;

        if (_.isFunction(sep)) {
            context = callback;
            callback = sep;
            sep = '.';
        }

        var watcher = new Watcher(id).watch(function() {
            return self.get(obj, path, sep);
        }, callback, context);

        return watcher;
    }
};

module.exports.deep = deep;

/**
 * @class Watcher
 * @param {string|number} id (optional) - An identifier, represents the watcher.
 * @description A watcher observes an object and executes a callback when
 * this object is changed.
 */
function Watcher(id) {
    this.id = id || 'NO-id-WATCHER';

    this.intervalId = null;
}

/**
 * @method Watcher.watch
 * @param {object|function} fn - An object or a function, which should be observed.
 * @param {function} callback - A callback, which can be executed.
 * @param {object} context (optional) - A context, in which the callback is executed.
 * @return {object} this
 * @description Create an interval, in which an object is checked against its old
 * and new value.
 */
Watcher.prototype.watch = function(fn, callback, context) {
    context = context || this;
    var oldValue = this.getValue(fn, context);

    var self = this;
    this.intervalId = setInterval(function() {
        process.nextTick(function() {
            var newValue = self.getValue(fn, context);

            if (!_.isEqual(newValue, oldValue)) {
                callback.apply(context, [newValue, oldValue]);
                oldValue = newValue;
            }
        });
    }, 0);

    return this;
};

/**
 * @method Watcher.unwatch
 * @return {object} this
 * @description Clear the stored interval. This means, that it stops observing
 * the object from the {@link Watcher.watch} method.
 */
Watcher.prototype.unwatch = function() {
    var intervalId = this.intervalId;

    if (intervalId) {
        clearInterval(intervalId);
        this.intervalId = null;
    }

    return this;
};

/**
 * @method Watcher.getValue
 * @private
 * @param {object|function} obj - The object or function gets executed.
 * @description This method simply checks, if an argument is a function and
 * if true, this function gets executed.
 */
Watcher.prototype.getValue = function(obj) {
    if (_.isFunction(obj)) {
        return obj.apply(this);
    }

    return _.cloneDeep(obj);
};

module.exports.Watcher = Watcher;
