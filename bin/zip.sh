#!/bin/sh

slug=$(basename $(pwd))
rm -rf release/*
zip -r "release/$slug.zip" \
    assets/ \
    includes/ \
    templates/ \
    field-guide-events-calendar.php \
    readme.txt
