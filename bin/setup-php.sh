#!/bin/bash

npm run wp-env run tests-cli bash -- -c 'cd wp-content/plugins/field_guide_events_calendar && composer install'
npm run wp-env run tests-cli -- sudo pecl install pcov

npm run wp-env run tests-cli bash -- -c 'echo "extension=pcov" | sudo tee /usr/local/etc/php/conf.d/99-pcov.ini > /dev/null'
npm run wp-env run tests-cli bash -- -c 'echo "pcov.enabled=1" | sudo tee -a /usr/local/etc/php/conf.d/99-pcov.ini > /dev/null'