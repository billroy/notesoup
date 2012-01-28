#! /bin/bash
date
git clone http://bitlash.net/git/notesoup.git
cd notesoup
heroku create --stack cedar
heroku addons:add redistogo
git push heroku master
heroku ps:scale web=1
date
