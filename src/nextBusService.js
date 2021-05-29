var request = require('request');

var NextBusService = function() {

};

var customRequest = request.defaults({
    method: 'GET',
    uri: "http://webservices.nextbus.com/service/publicJSONFeed",
    qs: {
        a: "charm-city",
        terse: true
    }
});

NextBusService.prototype.getRoutes = function(callback) {
    return customRequest({
        qs: {
            command: 'routeConfig'
        }
    }, callback);
};

NextBusService.prototype.getPredictions = function(params, callback) {
    return customRequest({
        qs: {
            command: "predictions",
            r: params.routeTag,
            s: params.stopTag
        }
    }, callback);
};

module.exports = NextBusService;