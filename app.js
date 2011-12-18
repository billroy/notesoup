
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

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

app.post('/notesoup.php', function(req, res) {
	console.log("Request body: " + typeof(req.body));
	console.dir(req.body);

	if (req.body.method == 'savenote') apisavenote(req, res);
	else if (req.body.method == 'sync') apisync(req, res);
	else if (req.body.method == 'sendnote') apisendnote(req, res);
	else {
		console.log("Error in request body: " + typeof(req.body));
		console.dir(req.body);
		console.log("*****");
		console.dir(req);
		res.send("Huh?");
	}
	
});


var updatelist;
var clock = new Date();

var redis = require("redis");
var client = redis.createClient();		// port, host, options
	
client.on("error", function (err) {
	console.log("Error " + err);
});

var nextnote = 1;


function apisavenote(req, res) {

	var folder = req.body.params['tofolder'];
	var note = req.body.params['note'];

	updatelist = [['beginupdate','']];
	updatelist.push(apisavenoteworker(folder, note));
	updatelist.push(['endupdate','']);

	res.send(updatelist);
}


function apisavenoteworker(folder, note) {

	if (!('id' in note)) {
		//note['id'] = redis.incr('nextnote');
		note['id'] = nextnote.toString();
		nextnote++;
	}

	var jnote = JSON.stringify(note);

	client.multi() 
		.hset('notes/' + folder, note['id'], jnote)
		.zadd('mtime/' + folder, clock.getTime(), note['id'])
	 	.exec(function (err, replies) {
			console.log("MULTI got " + replies.length + " replies");
			replies.forEach(function (reply, index) {
				console.log("Reply " + index + ": " + reply.toString());
	        });
        });

	return ['updatenote', jnote];
}



function apisync(req, res) {
	res.send(['say','sync...']);
}

function apisendnote(req, res) {
	res.send(['say','send...']);
}


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
