Note Soup 
===

### Requirements

- Node.js 0.6.6 ish
	http://blog.nodejs.org/2011/12/15/node-v0-6-6/
	http://nodejs.org/ for doc

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

Set the environment variable REDIS_URL if you're using a remote redis server:

	$ REDIS_URL="redis://barney:d9dc5a9d2c7a1727667e0fd7f17260f7@stingfish.redistogo.com:9361/"
	- or -
	$ REDIS_URL='redis://user:auth@hostname:port'
	$ export REDIS_URL

If REDIS_URL is not provided the server will connect to Redis on the default localhost:6379.


### Run

Run the server

	$ node soup.js

Browse to http://localhost:3000
