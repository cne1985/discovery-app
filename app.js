var builder = require('botbuilder');
var restify = require('restify');
var discovery = require('./discovery');
var newsday = require('./newsday');

var server = restify.createServer();

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

 