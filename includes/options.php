<?php
defined("ABSPATH") || exit();

/**
 * accessor for neon_crm_calendar options.
 *
 * Usage:
 *   neon_crm_calendar_get_option( 'neon_crm_api_key', '' );
 *   neon_crm_calendar_get_option( null ); // returns full array
 */
function neon_crm_calendar_get_option($key = null, $default = "")
{
    $opts = (array) get_option("neon_crm_calendar_options", []);

    if (null === $key) {
        return $opts;
    }

    return isset($opts[$key]) ? $opts[$key] : $default;
}
