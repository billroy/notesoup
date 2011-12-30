Note Soup 
===

### What is it?

Note Soup is a sticky-note organizer on steroids for the web.  

### Requirements

See also INSTALL-EC2 for a bare Ubuntu machine buildout.

### Requirements

- Git from http://git-scm.com/

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

Create a user account and play.
Hint: Create a note by typing in the command bar at the top

### Administer

The default administrative username is "system" and its default password is "frobozz88"

The system user provides a home for the system templates (in the folder system/templates); 
these are the templates that auto-populate the System part of the mytemplates folder.  

The welcome and login page is configured in the system/welcome folder.  Edit this as appropriate
for your site/project.

You must be logged in as system to delete a user, and to create a user if open account creation
is disabled.

If you want to run a closed soup, it is strongly suggested to delete the "guest" user, or at
least change its password from the default "kittylitter123".  Delete the guest login button
in system/welcome, too.

