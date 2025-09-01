#!/bin/sh

version=$(cat neon-crm-calendar.php | grep 'Version:' | sed 's/Version: //')
slug=$(basename $(pwd))
sha=$(git rev-parse --short HEAD)

zip -r "release/$slug-$version-$sha.zip" \
    assets/ \
    includes/ \
    templates/ \
    neon-crm-calendar.php \
    readme.txt
