#! /bin/bash
date
heroku create --stack cedar
heroku addons:add redistogo
git push heroku master
heroku ps:scale web=1
date
