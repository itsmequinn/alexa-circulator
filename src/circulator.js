'use strict';

var AlexaSkill = require('./AlexaSkill');
var NextBusService = require('./nextBusService');
var stopMatcher = require('./stopMatcher');

var APP_ID = "amzn1.echo-sdk-ams.app.83157cac-f56b-4c2e-ad16-cceb492454df";
var skillContext = {};
var appName = "Circulator";

var Circulator = function() {
    AlexaSkill.call(this, APP_ID);
};

Circulator.prototype = Object.create(AlexaSkill.prototype);
Circulator.prototype.constructor = Circulator;

/**
 * Overriden to show that a subclass can override this function to initialize session state.
 */
Circulator.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);

    // Any session init logic would go here.
};

/**
 * If the user launches without specifying an intent, route to the correct function.
 */
Circulator.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Circulator onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);

    handleLaunch(session, response);
};

/**
 * Overriden to show that a subclass can override this function to teardown session state.
 */
Circulator.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

    //Any session cleanup logic would go here.
};

Circulator.prototype.intentHandlers = {
    "GetNextBusIntent": function (intent, session, response) {
        console.log('request received');
        handleOneShotNextBusRequest(intent, session, response);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "To get the arrival time for the next bus at a station, simply ask using the station name and route name.";

        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        // For the repromptText, play the speechOutput again
        response.ask(speechOutput, repromptOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

var nextBusService = new NextBusService();

var handleLaunch = function(session, response) {
    var repromptText,
        speechText = repromptText = "Welcome to Circulator. You can ask for the arrival time of the next bus at a station by providing the route name and station name. For example, \"When is the next bus arriving on the Purple route at Fort Avenue?\"";

    var speechOutput = {
        speech: speechText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };

    response.askWithCard(speechOutput, repromptOutput, "Circulator", speechText);
};

var handleOneShotNextBusRequest = function(intent, session, response) {

    var stopNameIncluded,
        routeColorIncluded;

    if(intent.slots.StopName.value) {
        session.attributes.StopName = intent.slots.StopName.value;
    }

    if(intent.slots.RouteColor.value) {
        session.attributes.RouteColor = intent.slots.RouteColor.value;
    }

    stopNameIncluded = session.attributes.StopName ? true : false;
    routeColorIncluded = session.attributes.RouteColor ? true : false;


    if(stopNameIncluded && routeColorIncluded) {
        nextBusService
            .getRoutes(function(error, result, body) {
                try {
                    var jsonResponse = JSON.parse(body);

                    var matchingRoutes = jsonResponse.route.filter(function(item) {
                        return item.tag === session.attributes.RouteColor.toLowerCase();
                    });

                    if(matchingRoutes.length === 0) {
                        response.tell("No route by that name exists");
                        return;
                    }

                    var matchingStops = stopMatcher.filter(session.attributes.StopName, matchingRoutes[0].stop, 'title'),
                        matchingStop;

                    if(matchingStops[0].score > 0) {
                        matchingStop = matchingStops[0].value;
                    }

                    if(matchingStop) {
                        nextBusService.getPredictions({
                            stopTag: matchingStop.tag,
                            routeTag: matchingRoutes[0].tag
                        }, function(error, result, body) {

                            try {
                                var responseJSON = JSON.parse(body);

                                var predictions = responseJSON.predictions.direction.prediction,
                                    responseText = "The next bus will arrive at " + matchingStop.title.substr(4) + ' on the ' + session.attributes.RouteColor + ' line ';

                                predictions.forEach(function(item, index) {

                                    if(index === 0) {
                                        if(parseInt(item.minutes) === 0) {
                                            responseText += 'momentarily. Additional buses will arrive in ';
                                        } else {
                                            responseText += 'in ' + item.minutes + ' minute' + (item.minutes > 1 ? 's' : '') + '. Additional buses will arrive in ';
                                        }
                                    } else if((predictions.length - 1) === index) {
                                        responseText += 'and ' + item.minutes + ' minutes.';
                                    } else {
                                        responseText += item.minutes + ' minutes, ';
                                    }
                                });

                                response.tell(responseText);
                            } catch ($e) {
                                response.tell("I'm having trouble getting arrival predictions right now. Please try again later.")
                            }
                        })
                    } else {
                        response.tell("No stop by that name exists on that line.");
                    }
                } catch ($e) {
                    console.log($e);
                    response.tell(appName + ' encountered an error: ' + $e.message);
                }
            });
    } else if(stopNameIncluded) {
        response.ask("On which route is " + session.attributes.StopName +"?");
    } else if(routeColorIncluded) {
        response.ask("For which stop on the " + session.attributes.RouteColor + " route would you like arrival times?");
    } else {
        response.ask("For which route would you like arrival time information?");
    }
};

module.exports = Circulator;