Note Soup 
===

### Requirements

- Node.js 0.6.6 ish
	http://nodejs.org/

- A redis server, either:

	- Redis server running on the server host
		See http://redis.io/ for download/install instructions
		Start a local server:
		$ redis_server

	-or-

	- Remote redis server (http://redistogo.com, for example)
		Start a server and copy the server URL from the config page for REDIS_URL

### Install

Clone the project:

	$ git clone https://github.com/billroy/notesoup.git
	$ cd notesoup

Set REDIS_URL if you're using a remote redis server:

	$ REDIS_URL = 'redis://user:auth@hostname:port'
	$ export REDIS_URL


### Run

Run the server

	$ node soup.js

Browse to http://localhost:3000
