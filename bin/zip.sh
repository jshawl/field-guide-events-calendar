#!/bin/sh

slug=$(basename $(pwd))
rm -rf release/*
zip -r "release/$slug.zip" \
    assets/ \
    includes/ \
    templates/ \
    neon-crm-calendar.php \
    readme.txt
