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

/*****
var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
	socket.emit('tell', 'Welcome to the Soup.');
	//io.sockets.emit('tell', "One has Joined the Soup.");
	socket.on('tell', function (data) {
		console.log(data);
		io.sockets.emit('tell', data);
	});
});
*****/

// Configuration

app.configure(function(){
  //app.set('views', __dirname + '/views');
  //app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  //app.use(app.router);
  app.use(express.static(__dirname + '/public'));
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


app.post('/notesoup.php', function(req, res) {
	//console.log("Request body: " + typeof(req.body));
	//console.dir(req.body);
	//console.log("Memory usage:");
	//console.dir(process.memoryUsage());

	if (typeof(soup['api_'+req.body.method]) == "function") {
		soup['api_'+req.body.method](req, res);
	}

	//if (req.body.method == 'savenote') apisavenote(req, res);
	//else if (req.body.method == 'sync') apisync(req, res);
	//else if (req.body.method == 'sendnote') apisendnote(req, res);
	else {
		console.log("Error in request body: " + typeof(req.body));
		console.dir(req.body);
		console.log("*****");
		console.dir(req);
		res.send("Huh?");
	}
	
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
