#! /bin/bash
# Updates the code of an existing Heroku app
date
git pull
git push heroku master
heroku ps:scale web=1
date
