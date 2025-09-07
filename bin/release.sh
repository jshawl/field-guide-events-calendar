#!/bin/sh

slug=$(basename $(pwd))

./bin/zip.sh > /dev/null

unzip -qo release/$slug.zip -d svn/trunk
cp -r screenshots/ svn/assets/

echo "Copied zip assets to svn/trunk"
echo "https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/"