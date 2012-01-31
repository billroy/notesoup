/*****
	Note Soup server for node.js / redis
	
	Copyright 2011-2012 by Bill Roy.
	Licensed for use.  See LICENSE.

*****/

var opt = require('optimist');
var argv = opt.usage('Usage: $0 [flags]')
	.alias('p', 'port')
	.describe('p', 'port for the http server')
	.describe('noconsole', 'no console, e.g., running on heroku')
	.describe('nopush', 'do not start push services')
	.describe('nosignup', 'only the system user can create accounts')
	.argv;

if (argv.help) {
	opt.showHelp();
	process.exit();
}

var express = require('express');
var app = module.exports = express.createServer();
var util = require('util');

var soup = require('./notesoup.js');
soup.app = app;
soup.argv = argv;
soup.connect(process.env.REDISTOGO_URL);

// Configuration

app.configure(function() {
	app.use(express.cookieParser());
	app.use(express.session({ secret: "8kksmKhDxtgbwvl0" }));

	app.use(express.bodyParser());
	app.use(express.methodOverride());

	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function() {
	app.use(express.errorHandler()); 
});

app.get('/', function(req, res) {
	if (req.session.loggedin) res.redirect('/folder/' + req.session.username + '/inbox');
	else res.redirect('/folder/system/welcome');
});

app.get('/status', function(req, res) {
	res.send("OK");
});

app.get('/folder/:user/:folder', function(req, res) {
	soup.renderfolder(req, res, 'folder.html');
});

app.get('/notes/:user/:folder', function(req, res) {
	soup.renderfolder(req, res, 'notes.html');
});

app.post('/api', function(req, res) {
	soup.dispatch(req, res);	
});

app.listen(process.env.PORT || argv.port || 3000);
console.log("NoteSoup listening on port %d in %s mode", app.address().port, app.settings.env);
