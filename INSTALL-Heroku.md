## Deploying Note Soup on Heroku

### Requirements

* You need [git.](http://git-scm.com)

* You need an account at [Heroku](http://www.heroku.com/).  The free tier is suitable for testing and personal use.

### Local Workstation Setup

See the [Heroku NodeJS Cookbook](http://devcenter.heroku.com/articles/node-js) and perform the section "Local Workstation Setup".  After installing the appropriate package for your system, log in to Heroku:

	$ heroku login

Once you are logged in, continue with the deployment procedure here.

### RedisToGo nano.

RedisToGo provides a free "nano" tier of service that is suitable for experimentation and personal use.  Instructions on configuring this tier of service are below.

Be aware this free level of service does not include backup, and provides only 5MB storage.  If you use more than a couple hundred folders, you'll exceed the capacity of the nano tier.  [Consider a paid plan](http://addons.heroku.com/redistogo), or a local soup.

### Deployment procedure

	$ git clone http://bitlash.net/git/notesoup.git
	$ cd notesoup
	$ ./scripts/heroku-start.sh 


The console output will contain the name of your new server.  Open a browser on that url and you should see the system/welcome page.

### Change the 'System' user password!!!

Please log in at once as user 'system' with the default password 'frobozz88', 
and change the password to something else using the Change Password menu item, 
or the Change Password widget.

Now go read README.md and see all the work you saved.

And read about locking down the guest user, too.

### Administration

Manage your app from the [Heroku app console](https://api.heroku.com/myapps) or using the heroku command line tool.

Nuke your app and database, gone in an instant:

	$ heroku destroy
	
Your site is popular.  Add additional web workers:

	$ heroku ps:scale web=2

Is the site up?

	$ heroku ps
	soup:notesoup bill$ heroku ps
	Process  State       Command                   
	-------  ----------  ------------------------  
	web.1    up for 15m  node soup.js --noconsole  

What do the logs say?

	$ heroku logs

***

### Install Transcript

	soup:heroku bill$ date
	Fri Jan 27 19:20:20 MST 2012
	soup:heroku bill$ git clone http://bitlash.net/git/notesoup.git
	Cloning into notesoup...
	soup:heroku bill$ cd notesoup
	soup:notesoup bill$ heroku create --stack cedar
	Creating growing-stone-3517... done, stack is cedar
	http://growing-stone-3517.herokuapp.com/ | git@heroku.com:growing-stone-3517.git
	Git remote heroku added
	soup:notesoup bill$ heroku addons:add redistogo
	-----> Adding redistogo to growing-stone-3517... done, v3 (free)
	soup:notesoup bill$ git push heroku master
	Counting objects: 4112, done.
	Delta compression using up to 4 threads.
	Compressing objects: 100% (2681/2681), done.
	Writing objects: 100% (4112/4112), 6.41 MiB | 627 KiB/s, done.
	Total 4112 (delta 1329), reused 4034 (delta 1282)
	
	-----> Heroku receiving push
	-----> Node.js app detected
	-----> Fetching Node.js binaries
	-----> Vendoring node 0.4.7
	-----> Installing dependencies with npm 1.0.94
		   
		   > notesoup@0.0.2 postinstall /tmp/build_j66bgsr8j75p
		   > echo NoteSoup installed.  Next: npm install and npm start
		   
		   NoteSoup installed. Next: npm install and npm start
		   redis-url@0.1.0 ./node_modules/redis-url 
		   async@0.1.15 ./node_modules/async 
		   redis@0.7.1 ./node_modules/redis 
		   optimist@0.3.1 ./node_modules/optimist 
		   └── wordwrap@0.0.2
		   jade@0.20.0 ./node_modules/jade 
		   ├── commander@0.2.1
		   └── mkdirp@0.3.0
		   socket.io@0.8.7 ./node_modules/socket.io 
		   ├── policyfile@0.0.4
		   ├── redis@0.6.7
		   └── socket.io-client@0.8.7
		   express@2.5.2 ./node_modules/express 
		   ├── mkdirp@0.0.7
		   ├── mime@1.2.4
		   ├── qs@0.4.1
		   └── connect@1.8.5
		   async@0.1.15 /tmp/build_j66bgsr8j75p/node_modules/async
		   express@2.5.2 /tmp/build_j66bgsr8j75p/node_modules/express
		   connect@1.8.5 /tmp/build_j66bgsr8j75p/node_modules/express/node_modules/connect
		   qs@0.4.1 /tmp/build_j66bgsr8j75p/node_modules/express/node_modules/qs
		   mime@1.2.4 /tmp/build_j66bgsr8j75p/node_modules/express/node_modules/mime
		   formidable@1.0.8 /tmp/build_j66bgsr8j75p/node_modules/express/node_modules/connect/node_modules/formidable
		   mkdirp@0.0.7 /tmp/build_j66bgsr8j75p/node_modules/express/node_modules/mkdirp
		   jade@0.20.0 /tmp/build_j66bgsr8j75p/node_modules/jade
		   commander@0.2.1 /tmp/build_j66bgsr8j75p/node_modules/jade/node_modules/commander
		   mkdirp@0.3.0 /tmp/build_j66bgsr8j75p/node_modules/jade/node_modules/mkdirp
		   redis@0.7.1 /tmp/build_j66bgsr8j75p/node_modules/redis
		   redis-url@0.1.0 /tmp/build_j66bgsr8j75p/node_modules/redis-url
		   socket.io@0.8.7 /tmp/build_j66bgsr8j75p/node_modules/socket.io
		   socket.io-client@0.8.7 /tmp/build_j66bgsr8j75p/node_modules/socket.io/node_modules/socket.io-client
		   uglify-js@1.0.6 /tmp/build_j66bgsr8j75p/node_modules/socket.io/node_modules/socket.io-client/node_modules/uglify-js
		   websocket-client@1.0.0 /tmp/build_j66bgsr8j75p/node_modules/socket.io/node_modules/socket.io-client/node_modules/websocket-client
		   xmlhttprequest@1.2.2 /tmp/build_j66bgsr8j75p/node_modules/socket.io/node_modules/socket.io-client/node_modules/xmlhttprequest
		   policyfile@0.0.4 /tmp/build_j66bgsr8j75p/node_modules/socket.io/node_modules/policyfile
		   redis@0.6.7 /tmp/build_j66bgsr8j75p/node_modules/socket.io/node_modules/redis
		   optimist@0.3.1 /tmp/build_j66bgsr8j75p/node_modules/optimist
		   wordwrap@0.0.2 /tmp/build_j66bgsr8j75p/node_modules/optimist/node_modules/wordwrap
		   Dependencies installed
	-----> Discovering process types
		   Procfile declares types -> web
	-----> Compiled slug size is 11.0MB
	-----> Launching... done, v5
		   http://growing-stone-3517.herokuapp.com deployed to Heroku
	
	To git@heroku.com:growing-stone-3517.git
	 * [new branch]      master -> master
	soup:notesoup bill$ heroku ps:scale web=1
	Scaling web processes... done, now running 1
	soup:notesoup bill$ date
	Fri Jan 27 19:21:56 MST 2012
