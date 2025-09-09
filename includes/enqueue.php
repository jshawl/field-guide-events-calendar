<?php
defined("ABSPATH") || exit();

function field_guide_events_asset_atts($path)
{
    $plugin_dir = FIELD_GUIDE_EVENTS_CALENDAR_DIR;
    $plugin_url = FIELD_GUIDE_EVENTS_CALENDAR_URL;
    $file = $plugin_dir . $path;
    return [
        "url" => $plugin_url . $path,
        "version" => file_exists($file) ? filemtime($file) : null,
    ];
}

function field_guide_events_calendar_register_assets()
{
    $css_atts = field_guide_events_asset_atts("assets/css/style.css");

    wp_register_style(
        "field_guide_events_calendar",
        $css_atts["url"],
        [],
        $css_atts["version"],
    );

    // Register FullCalendar first (no deps), load in footer.
    $fc_atts = field_guide_events_asset_atts("assets/js/full-calendar.min.js");
    wp_register_script(
        "field_guide_events_calendar-fullcalendar",
        $fc_atts["url"],
        [], // deps
        "6.1.19", // version
        true, // in_footer
    );

    // Register plugin script and declare it depends on FullCalendar so FullCalendar loads first.
    $js_atts = field_guide_events_asset_atts("assets/js/calendar.js");
    wp_register_script(
        "field_guide_events_calendar",
        $js_atts["url"],
        ["field_guide_events_calendar-fullcalendar"], // deps
        $js_atts["version"], // version
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

function field_guide_events_list_shortcode($atts)
{
    $api_key = field_guide_events_calendar_get_option("neon_crm_api_key", "");
    $org_id = field_guide_events_calendar_get_option("neon_crm_org_id", "");
    if (empty($api_key) || empty($org_id)) {
        return field_guide_events_calendar_render_template(
            "templates/configuration-error.php",
        );
    }
    $js_atts = field_guide_events_asset_atts("assets/js/list.js");
    wp_enqueue_script(
        "field_guide_events_list",
        $js_atts["url"],
        [], // deps
        $js_atts["version"], // version
        true, // in_footer
    );
    $css_atts = field_guide_events_asset_atts("assets/css/list.css");
    wp_enqueue_style(
        "field_guide_events_list",
        $css_atts["url"],
        [], // deps
        $css_atts["version"], // version
    );
    return field_guide_events_calendar_render_template(
        "templates/list.php",
        $atts,
    );
}
add_shortcode("field_guide_events_list", "field_guide_events_list_shortcode");

function add_type_attribute($tag, $handle, $src)
{
    $modules = ["field_guide_events_calendar", "field_guide_events_list"];
    // if not your script, do nothing and return original $tag
    if (in_array($handle, $modules) === false) {
        return $tag;
    }
    // change the script tag by adding type="module" and return it.
    $tag = str_replace("<script ", '<script type="module" ', $tag);

    return $tag;
}
add_filter("script_loader_tag", "add_type_attribute", 10, 3);
