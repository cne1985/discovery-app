var builder = require('botbuilder');
var moment = require('moment');
var https = require('https');
var _ = require('lodash');

//CALL NEWSDAY SERVICE
module.exports = {
    showDiscoveryResults: function (session, selectedLabel, selectedDate) {

        var optionsSearch = {
            host: 'traininglabservices.azurewebsites.net',
            port: 443,
            path: '/api/newsday?date=' + selectedDate.toString(),
            method: 'GET'
        };

        var reqGet = https.request(optionsSearch, function (res) {
            res.on('data', function (results) {

                var payload = results.toString();

                if (payload.endsWith('}]')) {

                    var discoveryResults = JSON.parse(payload);

                    session.say('Discovering news from ' + selectedLabel + '...', 'Get ready for some news from ' + selectedLabel);

                    var convertedDate = new moment(selectedDate);

                    var msg = new builder.Message(session);

                    discoveryResults.forEach(element => {

                        var card = new builder.ThumbnailCard(session)
                            .title(element.Title)
                            .subtitle(element.Byline + ' ' + convertedDate.format('MM/DD/YYYY'))
                            .text(element.Summary)
                            .images([
                                builder.CardImage.create(session, 'https://www.nytimes.com/' + element.ImageUrl)

                            ])
                            .buttons([
                                builder.CardAction.openUrl(session, element.Url, 'Full Article')
                            ]);

                        msg.addAttachment(card);
                    });

                    msg.addAttachment(getAttributionCard());

                    session.send(msg);

                }
                else {
                    session.send('There was a problem processing your request');
                }

            });
        });

        reqGet.end();
        reqGet.on('error', function (e) {
            session.send(e.toString());
        });

    }
};

function getAttributionCard() {

    return {
        'contentType': 'application/vnd.microsoft.card.adaptive',
        'content': {
            'type': 'AdaptiveCard',
            "body": [
                {
                    "type": "Container",
                    "items": [

                        {
                            "type": "Image",
                            "url": "http://static01.nytimes.com/packages/images/developer/logos/poweredby_nytimes_65b.png",
                            "selectAction": {
                                "type": "Action.OpenUrl",
                                "title": "NY Times Developer API",
                                "url": "http://developer.nytimes.com"
                            }
                        }, {
                            "type": "TextBlock",
                            "text": "Data provided by The New York Times",
                            "size": "small",
                            "weight": "lighter",
                            "spacing": "none"
                        }

                    ]

                }

            ]
        }
    };
}; 