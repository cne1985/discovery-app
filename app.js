var builder = require('botbuilder');
var restify = require('restify');
var discovery = require('./discovery');
var newsday = require('./newsday');

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service

var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

server.post('/api/messages', connector.listen());

var inMemoryStorage = new builder.MemoryBotStorage();

var luisAppId = process.env.LuisAppId;
var luisSubscriptionKey = process.env.LuisAPIKey();
var luisApiHostName = process.env.luisApiHostName || 'westus.api.cognitive.microsoft.com';
var luisModelUrl = 'https://' + luisApiHostName + '/luis/v2.0/apps/' + luisAppId + '?subsciptionkey-key=' + luisSubscriptionKey

// Create the default bot session and dialog
var bot = new builder.UniversalBot(connector, function (session, args) {
    session.send("Welcome to **Discovery**. The coolest way to discover popular content...");
});

bot.set('storage', inMemoryStorage);

// Create a recogniser that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(luisModelUrl)
bot.recognizer(recognizer);

// End of Defaults

// Discover content for the requested entity
bot.dialog('DiscoverContentDialog', [
    function (session, args, next){
        var displayName = validateUserName(session);
        var intent = args.intent;

        if (intent.entities) {
            var searchQuery = intent.entities[0].entity;

            discovery.showDiscoveryResults(session, searchQuery);
        }
        else {
            session.replaceDialog('HelpDialog');
        }
    },
]).triggerAction({
    matches: 'DiscoverContent'
});
 