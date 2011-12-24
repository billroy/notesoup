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

app.get('/folder/:user/:folder', function(req, res) {
	render_folder(req, res, req.params.user, req.params.folder);
});

function render_folder(req, res, user, folder) {
	console.log('Render folder ' + user + ' ' + folder);
	//res.send(req.params.user + '/' + req.params.folder);
	//console.dir(req.params);

	// provision the client options	
	// TODO: hook up real security / sessions login
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

app.listen(3000);
console.log("NoteSoup listening on port %d in %s mode", app.address().port, app.settings.env);
