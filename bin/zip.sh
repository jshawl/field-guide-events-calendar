#!/bin/sh

slug=$(basename $(pwd))
rm -rf release/*
zip -r "release/$slug.zip" \
    assets/ \
    includes/ \
    templates/ \
    campaign-calendar.php \
    readme.txt
