'use strict';

var Circulator = require('./circulator');

exports.handler = function(event, context) {
    var circulator = new Circulator();
    circulator.execute(event, context);
};