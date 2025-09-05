<?php
defined("ABSPATH") || exit();

/**
 * accessor for field_guide_events_calendar options.
 *
 * Usage:
 *   field_guide_events_calendar_get_option( 'neon_crm_api_key', '' );
 *   field_guide_events_calendar_get_option( null ); // returns full array
 */
function field_guide_events_calendar_get_option($key = null, $default = "")
{
    $opts = (array) get_option("field_guide_events_calendar_options", []);

    if (null === $key) {
        return $opts;
    }

    return isset($opts[$key]) ? $opts[$key] : $default;
}
