Note Soup 
===

### What is it?

Note Soup is a live, multi-user sticky note organizer and dashboard factory based on node.js and Redis.

### Requirements

- Git
	- Download and [install Git for your platform](http://git-scm.com)

- Node.js 0.6.6 or later
	- Download and [install node.js for your platform](http://nodejs.org)

- npm
	- Download and [install npm for your platform](http://npmjs.org)

- A redis server, either:

	- Redis server running on your local host or server
		- This is the most tractable and common case
		- On OS X: you must first install XCode from the App Store
		- Download and [install redis for your platform](http://redis.io/download)
			- On OS X: note that wget is not installed by default (oy)
				- download with your browser, or...
				- use curl instead of wget (and substitute the latest redis version):
~~~
	$ curl -o redis.tgz http:////redis.googlecode.com/files/redis-2.4.6.tar.gz
	$ tar xzf redis.tgz
	$ cd redis-2.4.6
	$ make
	$ sudo make install
	$ redis-server
~~~
	-or-
	- Third party remote redis server, 
		- For example, [RedisToGo provides free 5MB servers](http://redistogo.com)
		- Start a server and copy the server URL from the config page for REDIS_URL

### OS X Lion Note

You need to set the NODE_PATH environment variable to make 'forever' happy.

There is a bug in Lion's ~/.bashrc handling.  See [this tip for a fix.](http://stackoverflow.com/questions/7780030/how-to-fix-terminal-not-loading-bashrc-on-os-x-lion)

My ~/.bashrc:

	NODE_PATH="/usr/local/lib/node_modules"
	export NODE_PATH

My ~/.bash_profile per the tip above:

	[[ -s ~/.bashrc ]] && source ~/.bashrc


### Install Options

Below are generic install instructions tested on OS X and several flavors of Linux.

- See also INSTALL-EC2 for a bare Ubuntu machine buildout.
- See also INSTALL-Heroku for an easy push-to-Heroku install.


### Generic Install Instructions

Install the dependencies above.

Get notesoup using git:

	$ git clone git://github.com/billroy/notesoup.git
	$ cd notesoup

Alternatively:
	- download the .zip file
	- unpack it somewhere to install
	- open a terminal and cd to the install directory

Install the node modules notesoup dependends on:

	$ npm install


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

If it isn't, start a local redis server like this, and let it spew:

	$ redis-server

Continue in another terminal window.


### Test Run

Start the server:

	$ cd (install directory)
	$ node soup.js

The database will auto-initialize the first time you run it.

When asked, specify a password for the "system" user; see below for more.

[Browse to the app at http://localhost:3000.](http://localhost:3000)

(Replace localhost with the server address if required.)

Create a user account and play.

Hint: Create a note by typing in the command bar at the top

^C to quit the server



### Run as a daemon (in the background)

Install the npm package 'forever' for global use:

	$ sudo npm install forever -g

Start the server:

	$ forever start soup.js

You must manually restart upon reboot.

Forever keeps logs and configuration in ~/.forever/


### Stop the daemon

	$ forever stop soup.js

### Refresh the notesoup code

	$ cd (install directory)
	$ forever stop soup.js
	$ git pull
	$ npm install
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
