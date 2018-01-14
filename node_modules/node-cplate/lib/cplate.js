var _         = require('lodash')
    , CConf   = require('node-cconf')
    , deep    = require('node-cconf').util.deep
    , util    = require('util')
    , sprintf = util.format
    , colors  = require('colors')
    , moment  = require('moment')
    , q       = require('q')
    , fs      = require('fs')
    , debug   = require('debug')('cplate');

function CPlate(opts) {
    var self = this;

    var config = new CConf('cplate', ['delimiter', 'filter'], {
        delimiter: '\\{\\{ | : \\}\\}',
        filter: {
            rightalign: function(value, opts, placeholder, param) {
                array = value.toString().split('').reverse();
                while (array.length < param) {
                    array.push(' ');
                }
                return array.reverse().join('');
            },
            colorize: function(value, opts, placeholder) {
                var args = _.toArray(arguments).slice(3);

                if (opts.theme && !_.isEqual(self.theme, opts.theme)) {
                    colors.setTheme(opts.theme);
                    self.theme = opts.theme;
                }
                if (args.length) {
                    args.map(function(param) {
                        value = value.toString()[param];
                    });
                } else if (opts.theme) {
                    value = value.toString()[opts[placeholder]];
                } else {
                    throw new TypeError('Invalid colorize parameters!');
                }

                return value;
            },
            uppercase: function(value) {
                if (_.isString(value)) {
                    return value.toUpperCase();
                } else {
                    throw new TypeError('Uppercase parameter must be of type "String"!');
                }
            },
            camelcase: function(value) {
                if (_.isString(value)) {
                    return value.split('-').map(function(value) {
                        return value && value[0].toUpperCase() + value.slice(1);
                    }).join('');
                } else {
                    throw new TypeError('Camelcase parameter must be of type "String"!');
                }
            },
            capitalize: function(value) {
                if (_.isString(value)) {
                    return value && value[0].toUpperCase() + value.slice(1);
                } else {
                    throw new TypeError('Capitalize parameter must be of type "String"!');
                }
            },
            datetime: function(value, opts, placeholder) {
                var args = _.toArray(arguments).slice(3);
                try {
                    return moment(value).format(args.join(config.getValue('delimiter').split(' ')[2]) || 'MMMM Do YYYY, HH:mm:ss');
                } catch (err) {
                    throw new TypeError('Datetime parameter must be a valid "Date"!');
                }
            }
        }
    }).load(opts || {});

    self.config = config;
    self.cache = {};
}

CPlate.prototype.__defineGetter__('classname', function() { return 'CPlate'; });

CPlate.prototype.registerFilter = function(name, fn) {
    if (_.isString(name) && _.isFunction(fn)) {
        var filters = this.config.getValue('filter');
        //if (_.isFunction(filters[name])) {
        //    throw new Error(sprintf('A filter named [%s] is already registered!', name));
        //} else {
            filters[name] = fn;
            debug('Successfully registered a filter named [%s]...', name);
        //}
    } else {
        throw new TypeError(sprintf('%s.registerFilter accepts only a string and a function as arguments!', this.classname));
    }

    return this;
};

CPlate.prototype.unregisterFilter = function(name) {
    if (_.isString(name)) {
        var filters = this.config.getValue('filter');
        if (filters[name]) {
            delete filters[name];
            debug('Successfully unregistered a filter named [%s]...', name);
        } else {
            debug('Cannot unregister filter named [%s]!', name);
        }
    } else {
        throw new TypeError(sprintf('%s.unregisterFilter accepts only a string as argument!', this.classname));
    }

    return this;
};

CPlate.prototype.format = function(str, opts, context) {
    var delimiter = this.config.getValue('delimiter').split(' ');
    context = context || this;

    if (_.isString(str) && _.isObject(opts)) {
        debug('Format string [%s] with options [%j]...', str, opts);
        var filters = this.config.getValue('filter');

        _.forEach(str.match(new RegExp(delimiter[0] + '.*?' + delimiter[3], 'g')), function(field) {
            var placeholders = field.replace(new RegExp(delimiter[0] + '|' + delimiter[3], 'g'), '').split(delimiter[1])
                .map(function(value) {
                    return value.trim();
                });
            debug('placeholders: %j', placeholders);

            var _placeholder = placeholders.shift()
                , value;

            if (_.isFunction(filters[_placeholder])) {
                value = filters[_placeholder].apply(context, [opts]);
            } else {
                value = deep.get(opts, _placeholder);
            }

            if (_.isUndefined(value)) {
                debug('No value for placeholder [%s] given!', _placeholder);
            } else {
                _.forEach(placeholders, function(placeholder) {
                    placeholder = placeholder.split(delimiter[2]).map(function(value) {
                        if (_.isNaN(parseInt(value))) {
                            return value.trim();
                        } else {
                            return parseInt(value.trim());
                        }
                    });

                    if (_.isFunction(filters[placeholder[0]])) {
                        value = filters[placeholder[0]].apply(context, [value, opts, _placeholder].concat(placeholder.slice(1)));
                    } else {
                        debug('No filter function with name [%s] registered!', placeholder);
                    }
                }, this);

                if (_.isFunction(filters['transformer'])) {
                    value = filters['transformer'].apply(context, [value, opts, _placeholder]);
                }

                str = str.replace(field, value);
            }
        }, this);

        if (_.isFunction(filters['finalizer'])) {
            str = filters['finalizer'].apply(context, [str, opts]);
        }
    } else {
        throw new TypeError(sprintf('%s.format accepts only a string and an object as arguments!', this.classname));
    }

    return str;
};

CPlate.prototype.formatArray = function(array, opts) {
    if (_.isArray(array) && _.isObject(opts)) {
        _.forEach(array, function(str, idx, array) {
            array[idx] = this.format(str, opts);
        }, this);
    } else {
        throw new TypeError(sprintf('%s.formatArray accepts only an array and an object as arguments!', this.classname));
    }

    return array;
};

CPlate.prototype.push = function(filename) {
    var self = this;

    return q.nfcall(fs.readFile, filename, 'utf-8')
    .then(function (data) {
        self.cache[filename] = data;
        return data;
    });
};

CPlate.prototype.clear = function(filename) {
    var self = this;

    if (_.isUndefined(filename)) {
        self.cache = {};
    } else {
        delete self.cache[filename];
    }

    return self;
};

CPlate.prototype.compile = function(filename, opts, context) {
    var self = this;

    if (_.isString(self.cache[filename])) {
        return q.fcall(function () {
            debug('took template from cache', filename);
            return self.format(self.cache[filename], opts, context);
        });
    } else {
        return self.push(filename)
        .then(function (data) {
            debug('pushed template to cache', filename);
            return self.format(data, opts, context);
        });
    }
};

module.exports = CPlate;
