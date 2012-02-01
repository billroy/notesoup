## Deploying Note Soup on Heroku

### Installing the Requirements

#### &#9744; Git

Download and install [git.](http://git-scm.com)

#### &#9744; Verified Heroku Account

Create a verified account at [Heroku](http://www.heroku.com/).  This means you will have to provide a credit card and email address.  There should be no charges to the card, unless you specifically configure more resources.  [Sign up for an account here.](https://api.heroku.com/signup)

Once you have received the signup email and configured a password, [verify your account here.](http://www.heroku.com/verify)  (If you skip this step, the install will fail because you need a verified account to use the Redis add-on.)

#### &#9744; Heroku Command Line Tools

Install the heroku command line tools.  See the [Heroku NodeJS Cookbook](http://devcenter.heroku.com/articles/node-js) and perform the section "Local Workstation Setup".  After installing the appropriate tools package for your system, log in to Heroku:

	heroku login

Once you are logged into Heroku and the credential formalities are complete, continue with the deployment procedure here.

### The Recipe: Deploying Note Soup to Heroku

Copy and paste this block of three lines into a terminal shell:

	git clone git://github.com/billroy/notesoup.git
	cd notesoup
	./scripts/heroku-start.sh 

The script will ask for an administrative password; you will use this only to log in as the 'system	' user to edit the welcome page and administer other users.

Enter a secure system password, and enter it again when prompted.

When the installation is complete the installer will open a browser window on the system/welcome page of your new Note Soup server. 

If you forget the url, you can open your application from the command line:

	heroku open

### Application Error at Startup

If you see an Application Error in the browser, check the terminal output to see if it has any advice.  A common problem is to skip the account verification step.  You'll get a complaint like this if you skipped verification:

	-----> Adding redistogo to sparkle-jasmine-5917... failed
	 !    Please verify your account to install this add-on
	 !    For more information, see http://devcenter.heroku.com/categories/billing
	 !    Confirm now at https://heroku.com/confirm

[Verify your account here.](http://www.heroku.com/verify), then nuke the defective app and try again:

	heroku destroy
	./scripts/heroku-start.sh


### Where the notes go: RedisToGo nano.

RedisToGo provides a free "nano" tier of service that is suitable for experimentation and personal use.

Be aware this free level of service does not include backup, and provides only 5MB storage.  If you use more than a couple hundred folders, you'll exceed the capacity of the nano tier.  [Consider a paid plan](http://addons.heroku.com/redistogo), or a local soup.

The scripts/heroku-start.sh script configures the nano tier of service; edit it if required.

### Disable Open Signup

By default, anyone can create a new account on your soup.  You can restrict account creation to only the system user with this command:

	heroku config:add nosignup=true
	
To re-enable:

	heroku config:delete nosignup

### Administration

Manage your app from the [Heroku app dashboard](https://api.heroku.com/myapps) or using the heroku command line tool.

You must be in the notesoup directory for the heroku command line tools to know which application to control:

	cd notesoup
	
Update the Note Soup code and restart the server:

	./scripts/heroku-update.sh

Nuke your app and database, gone in an instant:

	heroku destroy

Where the heck is my server, again?

	heroku info
	heroku open

Open your site in the browser:

	heroku open

Is the site up?

	heroku ps
	
	soup:notesoup bill$ heroku ps
	Process  State       Command                   
	-------  ----------  ------------------------  
	web.1    up for 15m  node soup.js --noconsole  

What do the logs say?

	heroku logs

Your site is popular.  Add additional web workers, for a fee:

	heroku ps:scale web=2

***

### Install Transcript

	think:notesoup bill$ ./scripts/heroku-start.sh 
	Tue Jan 31 10:41:36 MST 2012
	Note Soup Deploy-to-Heroku here!
	
	Enter an admin password for the new server:
	photon
	Enter it again:
	photonff
	Passwords do not match.
	aeolus:notesoup bill$ ./scripts/heroku-start.sh 
	Tue Jan 31 10:41:44 MST 2012
	Note Soup Deploy-to-Heroku here!
	
	Enter an admin password for the new server:
	photon
	Enter it again:
	photon
	Creating stark-robot-4635... done, stack is cedar
	http://stark-robot-4635.herokuapp.com/ | git@heroku.com:stark-robot-4635.git
	Git remote heroku added
	Adding config vars and restarting app... done, v2
	  soup_password => photon
	-----> Adding redistogo to stark-robot-4635... done, v3 (free)
	redistogo:nano
	Counting objects: 4335, done.
	Delta compression using up to 4 threads.
	Compressing objects: 100% (2708/2708), done.
	Writing objects: 100% (4335/4335), 6.44 MiB | 724 KiB/s, done.
	Total 4335 (delta 1479), reused 4325 (delta 1475)
	
	-----> Heroku receiving push
	-----> Node.js app detected
	-----> Fetching Node.js binaries
	-----> Vendoring node 0.4.7
	-----> Installing dependencies with npm 1.0.94
		   
		   > notesoup@0.0.2 postinstall /tmp/build_1h23qzj5ogu56
		   > echo NoteSoup installed.  Next: npm install and npm start
		   
		   NoteSoup installed. Next: npm install and npm start
		   redis-url@0.1.0 ./node_modules/redis-url 
		   async@0.1.15 ./node_modules/async 
		   redis@0.7.1 ./node_modules/redis 
		   optimist@0.3.1 ./node_modules/optimist 
		   └── wordwrap@0.0.2
		   jade@0.20.0 ./node_modules/jade 
		   ├── mkdirp@0.3.0
		   └── commander@0.2.1
		   socket.io@0.8.7 ./node_modules/socket.io 
		   ├── policyfile@0.0.4
		   ├── redis@0.6.7
		   └── socket.io-client@0.8.7
		   express@2.5.2 ./node_modules/express 
		   ├── qs@0.4.1
		   ├── mime@1.2.4
		   ├── mkdirp@0.0.7
		   └── connect@1.8.5
		   async@0.1.15 /tmp/build_1h23qzj5ogu56/node_modules/async
		   express@2.5.2 /tmp/build_1h23qzj5ogu56/node_modules/express
		   connect@1.8.5 /tmp/build_1h23qzj5ogu56/node_modules/express/node_modules/connect
		   qs@0.4.1 /tmp/build_1h23qzj5ogu56/node_modules/express/node_modules/qs
		   mime@1.2.4 /tmp/build_1h23qzj5ogu56/node_modules/express/node_modules/mime
		   formidable@1.0.8 /tmp/build_1h23qzj5ogu56/node_modules/express/node_modules/connect/node_modules/formidable
		   mkdirp@0.0.7 /tmp/build_1h23qzj5ogu56/node_modules/express/node_modules/mkdirp
		   jade@0.20.0 /tmp/build_1h23qzj5ogu56/node_modules/jade
		   commander@0.2.1 /tmp/build_1h23qzj5ogu56/node_modules/jade/node_modules/commander
		   mkdirp@0.3.0 /tmp/build_1h23qzj5ogu56/node_modules/jade/node_modules/mkdirp
		   redis@0.7.1 /tmp/build_1h23qzj5ogu56/node_modules/redis
		   redis-url@0.1.0 /tmp/build_1h23qzj5ogu56/node_modules/redis-url
		   socket.io@0.8.7 /tmp/build_1h23qzj5ogu56/node_modules/socket.io
		   socket.io-client@0.8.7 /tmp/build_1h23qzj5ogu56/node_modules/socket.io/node_modules/socket.io-client
		   uglify-js@1.0.6 /tmp/build_1h23qzj5ogu56/node_modules/socket.io/node_modules/socket.io-client/node_modules/uglify-js
		   websocket-client@1.0.0 /tmp/build_1h23qzj5ogu56/node_modules/socket.io/node_modules/socket.io-client/node_modules/websocket-client
		   xmlhttprequest@1.2.2 /tmp/build_1h23qzj5ogu56/node_modules/socket.io/node_modules/socket.io-client/node_modules/xmlhttprequest
		   policyfile@0.0.4 /tmp/build_1h23qzj5ogu56/node_modules/socket.io/node_modules/policyfile
		   redis@0.6.7 /tmp/build_1h23qzj5ogu56/node_modules/socket.io/node_modules/redis
		   optimist@0.3.1 /tmp/build_1h23qzj5ogu56/node_modules/optimist
		   wordwrap@0.0.2 /tmp/build_1h23qzj5ogu56/node_modules/optimist/node_modules/wordwrap
		   Dependencies installed
	-----> Discovering process types
		   Procfile declares types -> web
	-----> Compiled slug size is 11.0MB
	-----> Launching... done, v5
		   http://stark-robot-4635.herokuapp.com deployed to Heroku
	
	To git@heroku.com:stark-robot-4635.git
	 * [new branch]      master -> master
	Scaling web processes... done, now running 1
	Removing soup_password and restarting app... done, v6.
	=== stark-robot-4635
	Addons:        Redis To Go Nano, Basic Release Management
	Git URL:       git@heroku.com:stark-robot-4635.git
	Owner:         
	Repo Size:     16M
	Slug Size:     11M
	Stack:         cedar
	Web URL:       http://stark-robot-4635.herokuapp.com/
	Opening http://stark-robot-4635.herokuapp.com/
	Heroku install script complete.
	Tue Jan 31 10:42:43 MST 2012
