#!/bin/bash
#
# Note Soup: Heroku bootstrap script
#
# Usage: makesoup.sh [name-for-soup]
#
# Example:	makesoup.sh chowder
# => app is served at http://chowder.herokuapp.com
#
date
if [ $# -eq 0 ]
then
	export appdir="notesoup"
else
	export appdir="$1"
fi
echo "Application name:" $appdir
git clone git://github.com/billroy/notesoup.git $1
cd $appdir
./scripts/heroku-start.sh $1
date
