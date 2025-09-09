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

    // Register FullCalendar first (no deps), load in footer.
    wp_register_script(
        "field_guide_events_calendar-fullcalendar",
        $plugin_url . "assets/js/full-calendar.min.js",
        [], // deps
        "6.1.19", // version
        true, // in_footer
    );

    // Register plugin script and declare it depends on FullCalendar so FullCalendar loads first.
    wp_register_script(
        "field_guide_events_calendar",
        $plugin_url . "assets/js/script.js",
        ["field_guide_events_calendar-fullcalendar"], // deps
        file_exists($js_file) ? filemtime($js_file) : null, // version
        true, // in_footer
    );
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
    ];
    $atts = shortcode_atts($default_atts, $atts, "field_guide_events_calendar");
    wp_enqueue_style("field_guide_events_calendar");
    wp_enqueue_script("field_guide_events_calendar");
    wp_enqueue_script("field_guide_events_calendar-fullcalendar");

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
    $tag = str_replace("<script ", '<script type="module" ', $tag);

    return $tag;
}
add_filter("script_loader_tag", "add_type_attribute", 10, 3);
