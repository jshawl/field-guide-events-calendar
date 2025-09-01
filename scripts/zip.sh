#!/bin/sh

version=$(cat neoncrm-calendar.php | grep 'Version:' | sed 's/Version: //')
slug=$(basename $(pwd))

zip -r "release/$slug-$version.zip" \
    assets/ \
    includes/ \
    templates/ \
    neoncrm-calendar.php \
    readme.txt