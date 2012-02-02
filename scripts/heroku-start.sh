#! /bin/bash
date
echo Note Soup Deploy-to-Heroku here!
echo
echo "Enter a password for the 'system' (admin) user for the new server:"
read pass1
echo "Enter it again:"
read pass2
if [ $pass1 != $pass2 ]
then
	echo Passwords do not match.
	exit 1
fi

heroku create --stack cedar
heroku config:add soup_password=$pass1
heroku addons:add redistogo
heroku addons | grep 'redistogo'
if [ $? -ne 0 ] 
then
	echo ":( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( "
	echo
	echo "Sorry, there is a problem: The Redis addon could not be added."
	echo
	echo "Perhaps you did not complete the account verification process."
	echo "Please verify your Heroku account and try again."
	echo
	echo "http://www.heroku.com/verify"
	echo
	echo ":( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( "
	echo
	exit 1
fi
git push heroku master
heroku ps:scale web=1
heroku config:remove soup_password
heroku info
heroku open
echo 'Heroku install script complete.'
date
