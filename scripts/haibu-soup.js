var eyes = require('eyes'),
    haibu = require('haibu');

// Create a new client for communicating with the haibu server
var client = new haibu.drone.Client({
  host: 'localhost',
  port: 9002
});

// A basic package.json for a node.js application on haibu
var app = {
   "user": "bill",
   "name": "notesoup-test",
   "domain": "localhost",
   "repository": {
     "type": "git",
     "url": "https://billroy@github.com/billroy/notesoup.git",
   },
   "main":"./soup.js",
   "scripts": {
     "start": "node soup.js"
   }
};

// Attempt to start up a new application
client.start(app, function (err, result) {
  if (err) {
    console.log('Error spawning app: ' + app.name);
    return eyes.inspect(err);
  }

  console.log('Successfully spawned app:');
  eyes.inspect(result);
});


client.start(app, function (err, result) {
  eyes.inspect(err);
  eyes.inspect(result);
});