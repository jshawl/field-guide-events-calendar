<?php
defined( 'ABSPATH' ) || exit;

add_action( 'rest_api_init', function() {
	register_rest_route( 'neoncrm-calendar/v1', '/events', array(
		'methods'  => 'GET',
		'callback' => 'neoncrm_calendar_rest_get_events',
	) );
} );

function neoncrm_calendar_get_from_cache($cache_key, $url, $args) {
    $key = 'neoncrm_' . $cache_key . '_' . md5( json_encode($args) );
    $cached = get_transient( $key );
    $ttl = 300; // 5 minutes
    if ( false !== $cached ) {
        return $cached;
    }

    $resp = wp_remote_post( $url, $args );

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
    $start_date = gmdate('Y-m-d', strtotime('-1 month'));
    $end_date = gmdate('Y-m-d', strtotime('+3 month'));
    $base = 'https://api.neoncrm.com/v2/events/search/outputFields';
    $data = [
        'searchFields' => [
            [
                'field' => 'Event Start Date',
                'operator' => 'GREATER_THAN',
                'value' => $start_date
            ],
            [
                'field' => 'Event Start Date',
                'operator' => 'LESS_THAN',
                'value' => $end_date
            ],
            [
                'field' => 'Event Archived',
                'operator' => 'EQUAL',
                'value' => 'No'
            ]
        ],
        'outputFields' => [
                'Event ID',
                'Event Archive',
                'Event Name',
                'Event Start Date',
                'Event Start Time',
                'Event End Date',
                'Event End Time',
                'Event Category Name',
                'Event External URL'
        ],
        'pagination' => [
            'currentPage' => 0,
            'pageSize' => 100,
            'sortColumn' => 'Event Start Date',
            'sortDirection' => 'ASC',
        ]
    ];
    $args = array(
        'headers' => array(
            'Authorization' => 'Basic ' . base64_encode( $org_id . ':' . $api_key ),
            'Content-Type' => 'application/json'
        ),
        'body' => json_encode($data),
        'timeout' => 15
    );
    $events = neoncrm_calendar_get_from_cache('search', 'https://api.neoncrm.com/v2/events/search', $args);
    if ( empty ($events["searchResults"]) ) {
        return new WP_Error( 'no_events', 'Could not get events from Neon CRM', array( 'status' => 500 ) );
    }
    return rest_ensure_response($events);
}
