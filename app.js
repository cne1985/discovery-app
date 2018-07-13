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
var luisSubscriptionKey = process.env.LuisAPIKey;
var luisApiHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
var luisModelUrl = 'https://' + luisApiHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisSubscriptionKey;

//Create the default bot session and dialog
var bot = new builder.UniversalBot(connector, function (session, args) {
    session.send("Welcome to **Discovery**. The coolest way to discover popular content...");
});

bot.set('storage', inMemoryStorage);

// Create a recognizer that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(luisModelUrl);
bot.recognizer(recognizer);

// End of Defaults

// Discover content for the requested entity 
 bot.dialog('DiscoverContentDialog',
     [
         function (session, args, next) {

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
     ]
 ).triggerAction({
     matches: 'DiscoverContent',
 });	 

 // Search for news on the specified date
 bot.dialog('SearchNewsDialog',
     [
         function (session, args, next) {

             var displayName = validateUserName(session);

             var selectedDate;
             var selectedLabel;

             var intent = args.intent;
             var dateEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.date');

             if (dateEntity == null) {
                 dateEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.datetimeV2.daterange');
                 selectedDate = dateEntity.resolution.values[0].start;
                 selectedLabel = dateEntity.entity;
             }
             else {
                 selectedDate = dateEntity.resolution.values[0].value;
                 selectedLabel = dateEntity.entity;
             }

             if (dateEntity != null && selectedDate != null) {

                 newsday.showDiscoveryResults(session, selectedLabel, selectedDate);
             }
             else {
                 session.replaceDialog('HelpDialog');
             }

         },
     ]
 ).triggerAction({
     matches: 'SearchNews',
 });

 bot.dialog('GreetingDialog',
 (session) => {

     var displayName = validateUserName(session);
     session.send("Hello **" + displayName + "**, welcome to **Discovery**. The coolest way to discover popular content. Try saying something like *'Tell me about Nikola Tesla'*.");
     session.endDialog();
 }
 ).triggerAction({
     matches: 'Greeting',
 });	

 bot.dialog('HelpDialog',
     (session) => {

         var displayName = validateUserName(session);
         session.send("Try this **" + displayName + "**: Say something like *'Tell me about Nikola Tesla'* or *'What was happening last month'*.");

         session.endDialog();
     }
 ).triggerAction({
     matches: 'Help',
 });	

 bot.dialog('NoneDialog',
     (session) => {

         var displayName = validateUserName(session);

         session.send("Sorry " + displayName + ", I\'m not quite sure what you\'re asking. Try saying something like *'Tell me about Nikola Tesla'*.");
         session.endDialog();
     }
 ).triggerAction({
     matches: 'None',
 });	