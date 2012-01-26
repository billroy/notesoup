Note Soup 
===

### What is it?

Note Soup is a live, multi-user sticky note organizer and dashboard factory based on node.js and Redis.

### Requirements

- Git (http://git-scm.com)

- Node.js 0.6.6+ ish
	http://nodejs.org for doc/downloads
	http://blog.nodejs.org/2011/12/15/node-v0-6-6/

- npm
	http://npmjs.org

- A redis server, either:

	- Redis server running on the server host
		See http://redis.io/ for download/install instructions
	-or-
	- Remote redis server (http://redistogo.com, for example)
		Start a server and copy the server URL from the config page for REDIS_URL
		

### Install Options

Below are generic install instructions tested on OS X and several flavors of Linux.

- See also INSTALL-EC2 for a bare Ubuntu machine buildout.
- See also INSTALL-Heroku for an easy push-to-Heroku install.


### Generic Install Instructions

Get notesoup using git:

	$ git clone https://github.com/billroy/notesoup.git
	$ cd notesoup

Alternatively, download the .zip file and unpack it somewhere.

### Redis configuration

#### Remote redis

If you are using a remote redis server, you must first set the environment variable REDIS_URL:

	$ REDISTOGO_URL="redis://barney:d9dc5a9d2c7a1727667e0fd7f17260f7@stingfish.redistogo.com:9361/"
	- or -
	$ REDISTOGO_URL='redis://user:auth@hostname:port'
	$ export REDISTOGO_URL

#### Local redis (common case)

If REDIS_URL is not provided the server will connect to Redis on the default localhost:6379.

To make sure your redis server is running:

	$ redis-cli info

To start a local redis server:

	$ redis-server



### Test Run

Start the server:

	$ node soup.js

The database will auto-initialize the first time you run it.

When asked, specify a password for the "system" user; see below for more.

Browse to http://localhost:3000.

Create a user account and play.

Hint: Create a note by typing in the command bar at the top

^C to quit the server


### Run as a daemon

	$ forever start soup.js

You must manually restart upon reboot.


### Stop the daemon

	$ forever stop soup.js

### Refresh the code

	$ cd (wherever notesoup is)
	$ forever stop soup.js
	$ git pull
	$ forever start soup.js

### About the System user

The system user is the equivalent of "root" on the soup.

System provides a home for the system templates (in the folder system/templates); 
these are the templates that auto-populate the System part of the mytemplates dropdown.  

The welcome and login page is configured in the system/welcome folder.  Edit this as appropriate
for your site/project.

You must be logged in as system to delete a user, and to create a user if open account creation
is disabled.

### To change the system user password

The administrative username is "system".

You are required to enter a system password when the database is initialized.

You can change the password at any time, from the server console, like this:

	$ node passwd -u system -p newpassword


### About the Guest User

If you want to run a closed soup, it is strongly suggested to delete the "guest" user, or at
least change its password from the default "kittylitter123".  Delete the guest login button
in system/welcome, too.

	$ node passwd -u guest -p newpassword

### To change a user's password

	$ node passwd -u user -p newpassword
