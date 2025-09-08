<?php
defined("ABSPATH") || exit();

/**
 * Register assets and provide a shortcode that enqueues them.
 */

function field_guide_events_calendar_register_assets()
{
    $plugin_dir = FIELD_GUIDE_EVENTS_CALENDAR_DIR;
    $plugin_url = FIELD_GUIDE_EVENTS_CALENDAR_URL;

    $css_file = $plugin_dir . "assets/css/style.css";
    $js_file = $plugin_dir . "assets/js/script.js";

    wp_register_style(
        "field_guide_events_calendar",
        $plugin_url . "assets/css/style.css",
        [],
        file_exists($css_file) ? filemtime($css_file) : null,
    );
    wp_enqueue_style("field_guide_events_calendar");

    // Register FullCalendar first (no deps), load in footer.
    wp_register_script(
        "field_guide_events_calendar-fullcalendar",
        $plugin_url . "assets/js/full-calendar.min.js",
        [], // deps
        "6.1.19", // version
        true, // in_footer
    );
    wp_enqueue_script("field_guide_events_calendar-fullcalendar");

    $data = [
        "org_id" => field_guide_events_calendar_get_option(
            "neon_crm_org_id",
            "",
        ),
        "rest_url" => esc_url_raw(rest_url("field_guide_events_calendar/v1")),
    ];
    // Ensure the module can read the data via the global window object.
    $js = "window.field_guide_events_calendar = " . wp_json_encode($data) . ";";
    wp_add_inline_script(
        "field_guide_events_calendar-fullcalendar",
        $js,
        "after",
    );

    // Register plugin script and declare it depends on FullCalendar so FullCalendar loads first.
    wp_register_script(
        "field_guide_events_calendar",
        $plugin_url . "assets/js/script.js",
        ["field_guide_events_calendar-fullcalendar"], // deps
        file_exists($js_file) ? filemtime($js_file) : null, // version
        true, // in_footer
    );
    wp_enqueue_script("field_guide_events_calendar");
}
add_action("wp_enqueue_scripts", "field_guide_events_calendar_register_assets");

function field_guide_events_calendar_render_template($template_name, $atts = [])
{
    $template_path = FIELD_GUIDE_EVENTS_CALENDAR_DIR . $template_name;
    if (file_exists($template_path)) {
        ob_start();
        include $template_path;
        return ob_get_clean();
    }
}

/**
 * Shortcode that enqueues the assets and prints a container for the calendar.
 */
function field_guide_events_calendar_shortcode($atts)
{
    $api_key = field_guide_events_calendar_get_option("neon_crm_api_key", "");
    $org_id = field_guide_events_calendar_get_option("neon_crm_org_id", "");
    if (empty($api_key) || empty($org_id)) {
        return field_guide_events_calendar_render_template(
            "templates/configuration-error.php",
        );
    }

    $default_atts = [
        "filter_campaigns" => "false",
        "multi_day_events" => "true",
        "campaign_color" => "#75a548",
        "campaign_background_color" => "#75a548",
    ];
    $atts = shortcode_atts($default_atts, $atts, "field_guide_events_calendar");

    return field_guide_events_calendar_render_template(
        "templates/calendar.php",
        $atts,
    );
}
add_shortcode(
    "field_guide_events_calendar",
    "field_guide_events_calendar_shortcode",
);

function add_type_attribute($tag, $handle, $src)
{
    // if not your script, do nothing and return original $tag
    if ("field_guide_events_calendar" !== $handle) {
        return $tag;
    }
    // change the script tag by adding type="module" and return it.
    $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
    return $tag;
}
add_filter("script_loader_tag", "add_type_attribute", 10, 3);
