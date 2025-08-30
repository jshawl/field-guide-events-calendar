<?php
defined( 'ABSPATH' ) || exit;

/**
 * Register REST route and handle fetching events from Neon CRM.
 */

add_action( 'rest_api_init', function() {
	register_rest_route( 'neoncrm-calendar/v1', '/events', array(
		'methods'  => 'GET',
		'callback' => 'neoncrm_calendar_rest_get_events',
	) );
} );

function neoncrm_calendar_rest_get_events( WP_REST_Request $request ) {
	$opts    = get_option( 'neoncrm_calendar_options', array() );
	$api_key = isset( $opts['neoncrm_api_key'] ) ? $opts['neoncrm_api_key'] : '';

	if ( empty( $api_key ) ) {
		return new WP_Error( 'no_api_key', 'API key not configured', array( 'status' => 500 ) );
	}

	// TODO: replace with the actual Neon events endpoint and any required query params
	$neon_url = 'https://api.neoncrm.com/v2/your-endpoint';

	$args = array(
		'headers' => array(
			'Authorization' => 'Bearer ' . $api_key,
			'Accept'        => 'application/json',
		),
		'timeout' => 15,
	);

	$resp = wp_remote_get( $neon_url, $args );

	if ( is_wp_error( $resp ) ) {
		return new WP_Error( 'http_error', $resp->get_error_message(), array( 'status' => 500 ) );
	}

	$code = wp_remote_retrieve_response_code( $resp );
	$body = wp_remote_retrieve_body( $resp );

	// Try to decode JSON; if decode fails, return raw body as text with appropriate status.
	$decoded = json_decode( $body, true );
	if ( $decoded === null && json_last_error() !== JSON_ERROR_NONE ) {
		// Non-JSON or decode error — return raw body but mark as error if non-2xx.
		if ( $code >= 200 && $code < 300 ) {
			return rest_ensure_response( array( 'body' => $body ) );
		}
		return new WP_Error( 'invalid_response', $body, array( 'status' => $code ) );
	}

	if ( $code >= 200 && $code < 300 ) {
		return rest_ensure_response( $decoded );
	}

	// Forward Neon error code and message/body.
	return new WP_Error( 'neon_error', $decoded, array( 'status' => $code ) );
}
