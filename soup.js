/*****
	Note Soup server for node.js / redis
	
	Copyright 2011 by Bill Roy.
	Licensed for use.  See LICENSE.

*****/

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

var soup = require('./notesoup.js');
soup.connect(process.env.REDIS_URL);

soup.io = require('socket.io').listen(app);
soup.io.sockets.on('connection', function(socket) {
	console.log('Socket connection accepted.');
	socket.on('subscribe', function(request) {
		console.log('Subscription request:');
		console.dir(request);
		socket.on(request.channel, function(msg) {
			soup.io.sockets.emit(request.channel, msg);
		});
	});
});

var fs = require("fs");
var html_template = fs.readFileSync(__dirname + '/templates/index.html', 'utf-8');

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
	render_folder(req, res, req.params.user, req.params.folder);
});

app.get('/json/:user/:folder', function(req, res) {
	req.body.params = {};
	req.body.params.fromfolder = req.params.user + '/' + req.params.folder;
	soup.req = req;
	soup.res = res;
	soup.res.updatelist = [];
	soup.api_getnotes();
});

function render_folder(req, res, user, folder) {
	console.log('Render folder ' + user + ' ' + folder);
	//res.send(req.params.user + '/' + req.params.folder);
	//console.dir(req.params);

	// provision the client options	
	// TODO: hook up real ACL
	var opts = {
		loggedin:	req.session.loggedin || false,
		username:	req.session.username || 'guest',
		foldername:	user + '/' + folder,
		isowner:	true,
		iseditor:	true,
		isreader:	true,
		issender:	true,
		ispublic:	true
	//	initnotes:{}
	};

	// render index.html as a template with these options
	var this_page = html_template;
	var string_opts = JSON.stringify(opts);
	console.log('Rendering options:');
	console.log(string_opts);
	res.send(this_page.replace('\'{0}\'', string_opts));
};

app.post('/api', function(req, res) {
	console.log("api:session");
	console.dir(req.session);

	soup.dispatch(req, res);	
});

url = require('url');
http = require('http');

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
	}).on('error', function(e) {
		console.log("Geturl error: " + e.message);
	});
	
});


app.listen(3000);
console.log("NoteSoup listening on port %d in %s mode", app.address().port, app.settings.env);
