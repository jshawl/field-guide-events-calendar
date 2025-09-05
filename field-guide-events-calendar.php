<?php
/*
Plugin Name: Field Guide Events Calendar
Description: Plugin to display a calendar of events from Neon CRM.
Version: 1.0.0
Author: Jesse Shawl
Author URI: https://jesse.sh/
License: GPLv2 or later
*/

defined("ABSPATH") || exit();

// Define some constants used by the plugin.
if (!defined("FIELD_GUIDE_EVENTS_CALENDAR_DIR")) {
    define("FIELD_GUIDE_EVENTS_CALENDAR_DIR", plugin_dir_path(__FILE__));
}
if (!defined("FIELD_GUIDE_EVENTS_CALENDAR_URL")) {
    define("FIELD_GUIDE_EVENTS_CALENDAR_URL", plugin_dir_url(__FILE__));
}

// Load core components.
require_once FIELD_GUIDE_EVENTS_CALENDAR_DIR . "includes/options.php";
require_once FIELD_GUIDE_EVENTS_CALENDAR_DIR . "includes/enqueue.php";
require_once FIELD_GUIDE_EVENTS_CALENDAR_DIR . "includes/admin.php";
require_once FIELD_GUIDE_EVENTS_CALENDAR_DIR . "includes/rest.php";
