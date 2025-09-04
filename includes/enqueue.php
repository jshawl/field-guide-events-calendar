<?php
defined("ABSPATH") || exit();

/**
 * Register assets and provide a shortcode that enqueues them.
 */

function campaign_calendar_register_assets()
{
    $plugin_dir = CAMPAIGN_CALENDAR_DIR;
    $plugin_url = CAMPAIGN_CALENDAR_URL;

    $css_file = $plugin_dir . "assets/css/style.css";
    $js_file = $plugin_dir . "assets/js/script.js";

    wp_register_style(
        "campaign_calendar",
        $plugin_url . "assets/css/style.css",
        [],
        file_exists($css_file) ? filemtime($css_file) : null,
    );

    // Register FullCalendar first (no deps), load in footer.
    wp_register_script(
        "campaign_calendar-fullcalendar",
        $plugin_url . "assets/js/full-calendar.min.js",
        [], // deps
        "6.1.19", // version
        true, // in_footer
    );

    $data = [
        "org_id" => campaign_calendar_get_option("neon_crm_org_id", ""),
        "rest_url" => esc_url_raw(rest_url("campaign_calendar/v1")),
    ];
    // Ensure the module can read the data via the global window object.
    $js = "window.campaign_calendar = " . wp_json_encode($data) . ";";
    wp_add_inline_script("campaign_calendar-fullcalendar", $js, "after");

    // Register plugin script and declare it depends on FullCalendar so FullCalendar loads first.
    wp_register_script(
        "campaign_calendar",
        $plugin_url . "assets/js/script.js",
        ["campaign_calendar-fullcalendar"], // deps
        file_exists($js_file) ? filemtime($js_file) : null, // version
        true, // in_footer
    );
}
add_action("wp_enqueue_scripts", "campaign_calendar_register_assets");

function campaign_calendar_render_template($template_name, $atts = [])
{
    $template_path = CAMPAIGN_CALENDAR_DIR . $template_name;
    if (file_exists($template_path)) {
        ob_start();
        include $template_path;
        return ob_get_clean();
    }
}

/**
 * Shortcode that enqueues the assets and prints a container for the calendar.
 */
function campaign_calendar_shortcode($atts)
{
    $api_key = campaign_calendar_get_option("neon_crm_api_key", "");
    $org_id = campaign_calendar_get_option("neon_crm_org_id", "");
    if (empty($api_key) || empty($org_id)) {
        return campaign_calendar_render_template(
            "templates/configuration-error.php",
        );
    }

    $default_atts = [
        "filter_campaigns" => "false",
        "multi_day_events" => "true",
    ];
    $atts = shortcode_atts($default_atts, $atts, "campaign_calendar");
    wp_enqueue_style("campaign_calendar");
    wp_enqueue_script("campaign_calendar");
    wp_enqueue_script("campaign_calendar-fullcalendar");

    return campaign_calendar_render_template("templates/calendar.php", $atts);
}
add_shortcode("campaign_calendar", "campaign_calendar_shortcode");

function add_type_attribute($tag, $handle, $src)
{
    // if not your script, do nothing and return original $tag
    if ("campaign_calendar" !== $handle) {
        return $tag;
    }
    // change the script tag by adding type="module" and return it.
    $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
    return $tag;
}
add_filter("script_loader_tag", "add_type_attribute", 10, 3);
