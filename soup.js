/*****
	Note Soup server for node.js / redis
	
	Copyright 2011-2012 by Bill Roy.
	Licensed for use.  See LICENSE.

*****/

/**
 * Module dependencies.
 */

var express = require('express');
var app = module.exports = express.createServer();
var util = require('util');

var argv = require('optimist')
	.usage('Usage: $0 [flags]')
	.alias('p', 'port')
	.describe('p', 'port for the http server')
	.alias('n', 'no-console')
	.describe('n', 'no console, e.g., running on heroku')
	.argv;

var soup = require('./notesoup.js');
soup.app = app;
soup.argv = argv;
soup.connect(process.env.REDISTOGO_URL);

// Configuration

app.configure(function() {
	//app.set('views', __dirname + '/views');
	//app.set('view engine', 'jade');

	app.use(express.cookieParser());
	app.use(express.session({ secret: "8kksmKhDxtgbwvl0" }));

	app.use(express.bodyParser());
	app.use(express.methodOverride());

	//app.use(app.router);
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
	soup.renderworkspace(req, res);
});

app.post('/api', function(req, res) {
	console.log("api:session");
	console.dir(req.session);

	soup.dispatch(req, res);	
});

var url = require('url');
var http = require('http');

app.get('/geturl', function(req, res) {
	console.log('Geturl: ' + req.query.url);
	var options = url.parse(req.query.url);

	// handle local '/path' fetches as static
	if (!options.host) {
		console.log('Geturl: static ' + options.pathname);
		res.sendfile(__dirname + '/public' + options.pathname);
		return;
	}

	// fetch a remote url
	options.headers = {
//		'Accept': '*/*'
		'Accept': 'application/x-javascript; charset=utf-8'
	};
	options.agent = false;	// prevent Connection-Keepalive in the framework
	var httpreq = http.get(options, function(httpres) {
		httpres.on('data', function (chunk) {
			console.log('Geturl body: ' + chunk.length);
			res.write(chunk);
		});
		httpres.on('end', function (chunk) {
			console.log('Geturl done.');
			res.end();
		});
		//console.log("Geturl response: " + httpres.statusCode);
		//console.log("Geturl response: " + httpres.responseText);		
		//console.dir(httpres);
		console.dir(httpres.headers);
	}).on('error', function(e) {
		console.log("Geturl error: " + e.message);
	});
	
});


app.listen(process.env.PORT || argv.port || 3000);
console.log("NoteSoup listening on port %d in %s mode", app.address().port, app.settings.env);
