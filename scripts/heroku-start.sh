#! /bin/bash
date
heroku create --stack cedar
heroku addons:add redistogo
heroku addons | grep 'redistogo'
if [ $? -ne 0 ] 
then
	echo "Please verify your Heroku account and try again."
	exit 1
fi
git push heroku master
heroku ps:scale web=1
date
