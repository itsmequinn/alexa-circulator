'use strict';

var StopMatcher = {
    filter: function(input, list, key) {
        var matches = [];

        input = input.indexOf(" ") !== -1 ? input.toLowerCase().split(" ") : [input];

        list.forEach(function(item, index)  {
            var match = {
                value: item,
                score: 0
            };

            var test = key ? match.value[key].toLowerCase() : match.value.toLowerCase();

            input.forEach(function(inputItem) {
                if(test.indexOf(inputItem) !== -1) {
                    match.score++;
                }
            });

            matches.push(match);
        });

        matches.sort(function(itemA, itemB) {
            return itemB.score - itemA.score;
        });

        return matches;
    }
};

module.exports = StopMatcher;