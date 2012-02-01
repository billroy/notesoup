/*****
	password.js: Password Utility for Note Soup server for node.js / redis

	Copyright 2012 by Bill Roy.  See LICENSE. 

	Usage:
	$ node passwd -u system -p <new pass>

	todo: verify user exists first / create user
	feat: auto generate memorable password
	todo: invalidate logged-in sessions of the changed user

***/
var argv = require('optimist')
	.usage('Usage: $0 --user <username> --password <password>')
	.alias('u', 'user')
	.alias('p', 'password')
	.describe('u', 'username, e.g., system or guest')
	.describe('p', 'password, make it good')
	.demand(['u','p'])
	.argv;

var crypto = require('crypto');
var passwordhash = crypto.createHash('sha1').update(argv.p).digest('hex');

var soup = require('./notesoup.js');
soup.argv = argv;
soup.connect(process.env.REDISTOGO_URL);
soup.savepasswordhash(argv.u, passwordhash, function(err, reply) {
	process.exit();
});
