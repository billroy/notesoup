#! /bin/bash
date
echo Note Soup Deploy-to-Heroku here!
echo
echo Enter an admin password for the new server:
read pass1
echo Enter it again:
read pass2
if [ $pass1 -ne $pass2 ]
	echo Passwords do not match.
	exit 1
fi

heroku create --stack cedar
heroku config:add soup_password=$pass1
heroku addons:add redistogo
heroku addons | grep 'redistogo'
if [ $? -ne 0 ] 
then
	echo "The Redis addon could not be added."
	echo "Perhaps you did not complete the account verification process."
	echo "Please verify your Heroku account and try again."
	echo "http://www.heroku.com/verify"
	exit 1
fi
git push heroku master
heroku ps:scale web=1
heroku info
heroku open
date
	