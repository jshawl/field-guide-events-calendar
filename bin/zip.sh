#!/bin/sh

version=$(cat neoncrm-calendar.php | grep 'Version:' | sed 's/Version: //')
slug=$(basename $(pwd))
sha=$(git rev-parse --short HEAD)

zip -r "release/$slug-$version-$sha.zip" \
    assets/ \
    includes/ \
    templates/ \
    neoncrm-calendar.php \
    readme.txt
