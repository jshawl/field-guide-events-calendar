<?php
defined( 'ABSPATH' ) || exit;

/**
 * accessor for neoncrm_calendar options.
 *
 * Usage:
 *   neoncrm_calendar_get_option( 'neoncrm_api_key', '' );
 *   neoncrm_calendar_get_option( null ); // returns full array
 */
function neoncrm_calendar_get_option( $key = null, $default = '' ) {
	$opts = (array) get_option( 'neoncrm_calendar_options', array() );

	if ( null === $key ) {
		return $opts;
	}

	return isset( $opts[ $key ] ) ? $opts[ $key ] : $default;
}
