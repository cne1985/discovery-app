var ssml = require('./ssml')
var builder = require('botbuilder');
var https = require('https');
var _ = require('lodash');

//CALL DISCOVERY SERVICE
module.exports = {
    showDiscoveryResults: function (session, searchQuery) {

        var optionsSearch = {
            host: 'traininglabservices.azurewebsites.net',
            port: 443,
            path: '/api/discovery?searchQuery=' + encodeURIComponent(searchQuery),
            method: 'GET'
        };

        var reqGet = https.request(optionsSearch, function (res) {
            res.on('data', function (results) {

                var payload = results.toString();

                if (payload.endsWith('}')) {

                    var discoveryResult = JSON.parse(payload);

                    var imageHeader = (discoveryResult.Images.length > 0) ? {
                        "type": "TextBlock",
                        "text": "RELATED IMAGES",
                        "size": "small",
                    } : {};

                    var imageRows = (discoveryResult.Images.length > 0) ? _.chunk(discoveryResult.Images, discoveryResult.Images.length).map(group =>
                        ({
                            "type": "ImageSet",
                            "imageSize": "medium",
                            'images': group.map(asDiscoveryItem)
                        })) : {};

                    var videoHeader = (discoveryResult.Videos.length > 0) ? {
                        "type": "TextBlock",
                        "text": "RELATED VIDEO",
                        "size": "small"
                    } : {};

                    var videoRows = (discoveryResult.Videos.length > 0) ? _.chunk(discoveryResult.Videos, discoveryResult.Videos.length).map(group =>
                        ({
                            "type": "ImageSet",
                            "imageSize": "medium",
                            'images': group.map(asDiscoveryItem)

                        })) : {};

                    var newsHeader = (discoveryResult.News.length > 0) ? {
                        "type": "TextBlock",
                        "text": "RELATED NEWS",
                        "size": "small"
                    } : {};

                    var newsRows = (discoveryResult.News.length > 0) ? _.chunk(discoveryResult.News, discoveryResult.News.length).map(group =>
                        ({
                            "type": "ImageSet",
                            "imageSize": "medium",
                            'images': group.map(asDiscoveryItem)
                        })) : {};

                    var entityCard = {
                        'contentType': 'application/vnd.microsoft.card.adaptive',
                        'content': {
                            'type': 'AdaptiveCard',
                            "body": [
                                {
                                    "type": "Image",
                                    "url": discoveryResult.ImageUrl,
                                    "size": "stretch"
                                },
                                {
                                    "type": "Container",
                                    "items": [
                                        {
                                            "type": "ColumnSet",
                                            "separator": true,
                                            "columns": [
                                                {
                                                    "type": "Column",
                                                    "width": "stretch",
                                                    "items": [
                                                        {
                                                            "type": "TextBlock",
                                                            "text": discoveryResult.Title.toUpperCase(),
                                                            "size": "medium",
                                                            "weight": "bolder",
                                                            "wrap": true
                                                        },
                                                        {
                                                            "type": "TextBlock",
                                                            "spacing": "none",
                                                            "weight": "lighter",
                                                            "text": discoveryResult.Description,
                                                            "isSubtle": true,
                                                            "wrap": true
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },

                            ].concat(imageHeader).concat(imageRows).concat(videoHeader).concat(videoRows).concat(newsHeader).concat(newsRows)
                        }
                    };

                    var readDescription = discoveryResult.Description.split('.')[0];

                    var msg = new builder.Message(session).speak(ssml.speak(readDescription)).addAttachment(entityCard);
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

function asDiscoveryItem(image) {
    return {
        "type": "Image",
        "url": image.ThumbnailUrl,
        "name": image.Title,
        "selectAction": {
            "type": "Action.OpenUrl",
            "title": image.Title,
            "url": image.Url
        }
    };
};