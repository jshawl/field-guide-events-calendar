<?php
defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', function() {
	register_rest_route( 'neoncrm-calendar/v1', '/events', array(
		'methods'  => 'GET',
		'callback' => 'neoncrm_calendar_rest_get_events',
	) );
} );

function get_from_cache($cache_key, $url) {
    $key = 'neoncrm_' . $cache_key . '_' . md5( $url );
    $cached = get_transient( $key );
    $ttl = 300; // 5 minutes
    if ( false !== $cached ) {
        return $cached;
    }

    $resp = wp_remote_get( $url, array( 'timeout' => 15 ) );

	if ( is_wp_error( $resp ) ) {
		return new WP_Error( 'http_error', $resp->get_error_message(), array( 'status' => 500 ) );
	}

    $code = wp_remote_retrieve_response_code( $resp );
	$body = wp_remote_retrieve_body( $resp );
    $decoded = json_decode( $body, true );
    if ( $code >= 200 && $code < 300 ) {
        set_transient( $key, $decoded, $ttl );
        return $decoded;
	}
    return new WP_Error( 'neon_error', $decoded, array( 'status' => $code ) );
}

function neoncrm_calendar_rest_get_events( WP_REST_Request $request ) {
	$api_key = neoncrm_calendar_get_option( 'neoncrm_api_key', '' );
	$org_id  = neoncrm_calendar_get_option( 'neoncrm_org_id', '' );
	if ( empty( $api_key ) ) {
		return new WP_Error( 'no_api_key', 'API key not configured', array( 'status' => 500 ) );
	}
    if ( empty( $org_id ) ) {
        return new WP_Error( 'no_org_id', 'Org ID not configured', array( 'status' => 500 ) );
    }
	$neon_login_url = 'https://api.neoncrm.com/neonws/services/api/common/login?login.apiKey=' . $api_key . '&login.orgid=' . $org_id;
    $login = get_from_cache("login", $neon_login_url);
    $user_session_id = $login["loginResponse"]["userSessionId"];
    if ( empty( $user_session_id ) ) {
        return new WP_Error( 'no_session', 'Could not get user session ID from Neon CRM', array( 'status' => 500 ) );
    }   
    $start_date = date('Y-m-d', strtotime('-1 month'));
    $end_date = date('Y-m-d', strtotime('+3 month'));
    $base = 'https://api.neoncrm.com/neonws/services/api/event/listEvents';
    $params = array(
        'responseType=json',
        'userSessionId=' . rawurlencode( $user_session_id ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Event Category Name' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Event ID' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Event Name' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Total Revenue' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Campaign ID' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Campaign Name' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Event Start Date' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Event Start Time' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Event End Date' ),
        'outputfields.idnamepair.name=' . rawurlencode( 'Event End Time' ),
        'searches.search.key=' . rawurlencode( 'Event Start Date' ),
        'searches.search.searchOperator=GREATER_THAN',
        'searches.search.value=' . rawurlencode( $start_date ),
        'searches.search.key=' . rawurlencode( 'Event End Date' ),
        'searches.search.searchOperator=LESS_THAN',
        'searches.search.value=' . rawurlencode( $end_date ),
        'page.pageSize=200',
    );
    $neon_events_url = $base . '?' . implode( '&', $params );
    $events = get_from_cache("events", $neon_events_url);
    if ( empty ($events["listEvents"]["searchResults"]) ) {
        return new WP_Error( 'no_events', 'Could not get events from Neon CRM', array( 'status' => 500 ) );
    }
    return rest_ensure_response($events);
}
