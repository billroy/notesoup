#! /bin/bash

echo Enter a name for the new soup:
read soup
if [ $soup == "" ]
then
	soup = "notesoup"
fi
echo 
git clone git://github.com/billroy/notesoup.git $soup
cd $soup
./scripts/heroku-start.sh 
