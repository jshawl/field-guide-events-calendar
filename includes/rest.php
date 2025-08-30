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
	$opts    = get_option( 'neoncrm_calendar_options', array() );
	$api_key = isset( $opts['neoncrm_api_key'] ) ? $opts['neoncrm_api_key'] : '';
    $org_id  = isset( $opts['neoncrm_org_id'] ) ? $opts['neoncrm_org_id'] : '';

	if ( empty( $api_key ) ) {
		return new WP_Error( 'no_api_key', 'API key not configured', array( 'status' => 500 ) );
	}
    if ( empty( $org_id ) ) {
        return new WP_Error( 'no_org_id', 'Org ID not configured', array( 'status' => 500 ) );
    }
	$neon_login_url = 'https://api.neoncrm.com/neonws/services/api/common/login?login.apiKey=' . $api_key . '&login.orgid=' . $org_id;
    $login = get_from_cache("login", $neon_login_url);
    if ( is_wp_error( $login ) ) {
        return $login;
    }
    $user_session_id = $login["loginResponse"]["userSessionId"];
    $start_date = date('Y-m-d', strtotime('-1 month'));
    $end_date = date('Y-m-d', strtotime('+3 month'));
    $neon_events_url = 'https://api.neoncrm.com/neonws/services/api/event/listEvents?responseType=json&userSessionId=' . $user_session_id . '&outputfields.idnamepair.name=Event%20Category%20Name&outputfields.idnamepair.name=Event%20ID&outputfields.idnamepair.name=Event%20Name&outputfields.idnamepair.name=Total%20Revenue&outputfields.idnamepair.name=Campaign%20ID&outputfields.idnamepair.name=Campaign%20Name&outputfields.idnamepair.name=Event%20Start%20Date&outputfields.idnamepair.name=Event%20Start%20Time&outputfields.idnamepair.name=Event%20End%20Date&outputfields.idnamepair.name=Event%20End%20Time&searches.search.key=Event%20Start%20Date&searches.search.searchOperator=GREATER_THAN&searches.search.value='. $start_date .'&searches.search.key=Event%20End%20Date&searches.search.searchOperator=LESS_THAN&searches.search.value='. $end_date . '&page.pageSize=200';
    $events = get_from_cache("events", $neon_events_url);
     if ( is_wp_error( $events ) ) {
        return $events;
    }
    return rest_ensure_response($events);
}
