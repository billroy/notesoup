#! /bin/bash

echo Enter a name for the new soup:
read appname
if [ $appname == "" ]
then
	appname = "notesoup"
fi
echo 
git clone git://github.com/billroy/notesoup.git $appname
cd $appname
export appname
./scripts/heroku-start.sh $appname
