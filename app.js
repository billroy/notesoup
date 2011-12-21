/*****
	Note Soup server for node.js / redis
	
	Copyright 2011 by Bill Roy.
	Licensed for use.  See LICENSE.

Database use:

	hash: notes/<user>/<folder>
		field: note.id
		value: json representation of note data
	
	sorted set: mtime/<user>/<folder>
		score: note update time from new Date().getTime()
		id: note.id
	
	integer: next/<user>/<folder>
		next note number in sequence
		actually pre-increments...

*****/

/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
	console.log('Socket connection accepted.');
	socket.on('message', function(data) {
		io.sockets.emit('message', data);
	});

	//socket.emit('message', 'Welcome to the Soup.');
	//io.sockets.emit('tell', "One has Joined the Soup.");
	//socket.on('tell', function (data) {
	//	console.log(data);
	//	io.sockets.emit('tell', data);
	//});
});

// Configuration

app.configure(function(){
  //app.set('views', __dirname + '/views');
  //app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
//  app.use(express.errorHandler());
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
//app.get('/', routes.index);


var soup = require('./notesoup.js');
soup.connect(process.env.REDIS_URL);

app.get('/folder/:user/:folder', function(req, res) {
	res.send(req.params.user + '/' + req.params.folder);
	console.dir(req.params);
});

app.post('/api', function(req, res) {
	soup.dispatch(req, res);	
});

app.listen(3000);
console.log("NoteSoup listening on port %d in %s mode", app.address().port, app.settings.env);
