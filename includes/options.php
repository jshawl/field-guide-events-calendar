<?php
defined("ABSPATH") || exit();

/**
 * accessor for campaign_calendar options.
 *
 * Usage:
 *   campaign_calendar_get_option( 'neon_crm_api_key', '' );
 *   campaign_calendar_get_option( null ); // returns full array
 */
function campaign_calendar_get_option($key = null, $default = "")
{
    $opts = (array) get_option("campaign_calendar_options", []);

    if (null === $key) {
        return $opts;
    }

    return isset($opts[$key]) ? $opts[$key] : $default;
}
