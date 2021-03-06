var cheerio = require('cheerio');
var request = require('request');
var validator = require('validator');
var stats = {
    protocols: [
        'http',
        'https',
        'ftp'
    ],
    require_protocol: true
};

var attributeMapping = {
    'og': 'facebook'
};

module.exports = function(link, cb) {
    if (!link) {
        cb({ message: 'Url is empty' }, null);
        return;
    }

    if (!validator.isURL(link, stats)) {
        cb({ message: 'Url is not valid' }, null);
        return;
    }

    request(link, function(error, response, body) {

        if (error || response === undefined) {
            cb({ message: 'Empty response' });
            return;
        }

        var $ = cheerio.load(body);
        var meta = $('meta');
        var metatags = {};

        /* Purge invalid tags on the object */
        meta = meta.filter(function(m) {
            return meta[m].hasOwnProperty('attribs')
                && meta[m].attribs !== undefined
                // Has either property or name:
                && (meta[m].attribs.property !== undefined ||
                    meta[m].attribs.name !== undefined)
                && meta[m].attribs.content !== undefined;
        });

        meta.each(function(m) {
            var _meta = meta[m];

            var property;

            if (_meta.attribs.property) {
                property = _meta.attribs.property.split(':');
            } else {
                property = _meta.attribs.name.split(':');
            }

            /*
             * Checking if property name is mapped to a value, if it's not,
             * use it as it is
             */
            var propertyName = attributeMapping[property[0]] ? attributeMapping[property[0]] : property[0];
            var propertyValue = property[1];

            /*
             * Checks if the meta tag 'vendor' is present on our metatags hash
             */
            if (!metatags.hasOwnProperty(propertyName)) {
                metatags[propertyName] = {};
            }

            metatags[propertyName][propertyValue] = _meta.attribs.content;
        });

        cb(null, metatags);
    });
};
