<?php
defined("ABSPATH") || exit();

add_action("rest_api_init", function () {
    register_rest_route("neon-crm-calendar/v1", "/listEvents", [
        "methods" => "GET",
        "callback" => "neon_crm_calendar_rest_list_events",
    ]);
});

add_action("rest_api_init", function () {
    register_rest_route("neon-crm-calendar/v1", "/events", [
        "methods" => "GET",
        "callback" => "neon_crm_calendar_rest_get_events",
    ]);
});

function neon_crm_calendar_get_from_cache($cache_key, $url, $args)
{
    $key = "neon_crm_" . $cache_key . "_" . md5(json_encode($args));
    $cached = get_transient($key);
    $ttl = 60 * 60; // 1 hour
    if (false !== $cached) {
        return $cached;
    }

    if (empty($args["body"])) {
        $resp = wp_remote_get($url, $args);
    } else {
        $resp = wp_remote_post($url, $args);
    }

    if (is_wp_error($resp)) {
        return new WP_Error("http_error", $resp->get_error_message(), [
            "status" => 500,
        ]);
    }

    $code = wp_remote_retrieve_response_code($resp);
    $body = wp_remote_retrieve_body($resp);
    $decoded = json_decode($body, true);
    if ($code >= 200 && $code < 300) {
        set_transient($key, $decoded, $ttl);
        return $decoded;
    }
    return new WP_Error("neon_error", $decoded, ["status" => $code]);
}

function neon_crm_calendar_rest_list_events(WP_REST_Request $request)
{
    // todo before action validate keys in both routes
    $api_key = neon_crm_calendar_get_option("neon_crm_api_key", "");
    $org_id = neon_crm_calendar_get_option("neon_crm_org_id", "");
    if (empty($api_key)) {
        return new WP_Error("no_api_key", "API key not configured", [
            "status" => 500,
        ]);
    }
    if (empty($org_id)) {
        return new WP_Error("no_org_id", "Org ID not configured", [
            "status" => 500,
        ]);
    }
    $base = "https://api.neoncrm.com/v2/events";
    $args = [
        "headers" => [
            "Authorization" =>
                "Basic " . base64_encode($org_id . ":" . $api_key),
            "Content-Type" => "application/json",
        ],
        "timeout" => 15,
    ];
    $start_date = gmdate("Y-m-d", strtotime("-1 month"));
    $end_date = gmdate("Y-m-d", strtotime("+3 month"));
    $params = [
        "startDateAfter=" . rawurlencode($start_date),
        "endDateBefore=" . rawurlencode($end_date),
        "pageSize=200",
    ];
    $neon_events_url = $base . "?" . implode("&", $params);
    $events = neon_crm_calendar_get_from_cache(
        "listEvents",
        $neon_events_url,
        $args,
    );
    if (empty($events)) {
        return new WP_Error("no_events", "Could not get events from Neon CRM", [
            "status" => 500,
        ]);
    }
    return rest_ensure_response($events);
}

function neon_crm_calendar_rest_get_events(WP_REST_Request $request)
{
    // todo before action validate keys in both routes
    $api_key = neon_crm_calendar_get_option("neon_crm_api_key", "");
    $org_id = neon_crm_calendar_get_option("neon_crm_org_id", "");
    if (empty($api_key)) {
        return new WP_Error("no_api_key", "API key not configured", [
            "status" => 500,
        ]);
    }
    if (empty($org_id)) {
        return new WP_Error("no_org_id", "Org ID not configured", [
            "status" => 500,
        ]);
    }
    $start_date = gmdate("Y-m-d", strtotime("-1 month"));
    $end_date = gmdate("Y-m-d", strtotime("+3 month"));
    $data = [
        "searchFields" => [
            [
                "field" => "Event Start Date",
                "operator" => "GREATER_THAN",
                "value" => $start_date,
            ],
            [
                "field" => "Event Start Date",
                "operator" => "LESS_THAN",
                "value" => $end_date,
            ],
            [
                "field" => "Event Archived",
                "operator" => "EQUAL",
                "value" => "No",
            ],
        ],
        "outputFields" => [
            "Event ID",
            "Event Archive",
            "Event Name",
            "Event Start Date",
            "Event Start Time",
            "Event End Date",
            "Event End Time",
            "Event Category Name",
            "Event External URL",
        ],
        "pagination" => [
            "currentPage" => 0,
            "pageSize" => 200,
            "sortColumn" => "Event Start Date",
            "sortDirection" => "ASC",
        ],
    ];
    $args = [
        "headers" => [
            "Authorization" =>
                "Basic " . base64_encode($org_id . ":" . $api_key),
            "Content-Type" => "application/json",
        ],
        "body" => json_encode($data),
        "timeout" => 30,
    ];
    $events = neon_crm_calendar_get_from_cache(
        "search",
        "https://api.neoncrm.com/v2/events/search",
        $args,
    );
    if (empty($events["searchResults"])) {
        return new WP_Error("no_events", "Could not get events from Neon CRM", [
            "status" => 500,
        ]);
    }
    return rest_ensure_response($events);
}
