<?php
defined( 'ABSPATH' ) || exit;

/**
 * Register assets and provide a shortcode that enqueues them.
 */

function neoncrm_calendar_register_assets() {
	$plugin_dir = NEONCRM_CALENDAR_DIR;
	$plugin_url = NEONCRM_CALENDAR_URL;

	$css_file = $plugin_dir . 'assets/css/style.css';
	$js_file  = $plugin_dir . 'assets/js/script.js';

	wp_register_style(
		'neoncrm-calendar',
		$plugin_url . 'assets/css/style.css',
		array(),
		file_exists( $css_file ) ? filemtime( $css_file ) : null
	);

	// Register FullCalendar first (no deps), load in footer.
	wp_register_script(
		'neoncrm-calendar-fullcalendar',
		'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.19/index.global.min.js',
		array(),                         // deps
		'6.1.19',                        // version
		true                             // in_footer
	);
	
	$data = array(
		'org_id'   => neoncrm_calendar_get_option( 'neoncrm_org_id', '' ),
		'rest_url' => esc_url_raw( rest_url( 'neoncrm-calendar/v1/events' ) ),
	);
	// Ensure the module can read the data via the global window object.
	$js = 'window.neoncrm_calendar = ' . wp_json_encode( $data ) . ';';
	wp_add_inline_script( 'neoncrm-calendar-fullcalendar', $js, 'after' );


	// Register plugin script and declare it depends on FullCalendar so FullCalendar loads first.
	wp_register_script(
		'neoncrm-calendar',
		$plugin_url . 'assets/js/script.js',
		array( 'neoncrm-calendar-fullcalendar' ),   // deps
		file_exists( $js_file ) ? filemtime( $js_file ) : null, // version
		true                                         // in_footer
	);
}
add_action( 'wp_enqueue_scripts', 'neoncrm_calendar_register_assets' );

function neoncrm_calendar_render_template( $template_name, $atts = array() ) {
	$template_path = NEONCRM_CALENDAR_DIR . $template_name;
	if ( file_exists( $template_path ) ) {
		ob_start();
		include $template_path;
		return ob_get_clean();
	}
}

/**
 * Shortcode that enqueues the assets and prints a container for the calendar.
 */
function neoncrm_calendar_shortcode( $atts ) {
	$api_key = neoncrm_calendar_get_option( 'neoncrm_api_key', '' );
	$org_id  = neoncrm_calendar_get_option( 'neoncrm_org_id', '' );
	if( empty( $api_key ) || empty( $org_id ) ) {
		return neoncrm_calendar_render_template('templates/configuration-error.php');
	}

	$default_atts = array(
		'filter_categories' => 'false'
	);
	$atts = shortcode_atts($default_atts, $atts, 'neoncrm_calendar');
	wp_enqueue_style( 'neoncrm-calendar' );
	wp_enqueue_script( 'neoncrm-calendar' );
	wp_enqueue_script( 'neoncrm-calendar-fullcalendar' );	

	return neoncrm_calendar_render_template('templates/calendar.php', $atts );
}
add_shortcode( 'neoncrm_calendar', 'neoncrm_calendar_shortcode' );

function add_type_attribute($tag, $handle, $src) {
    // if not your script, do nothing and return original $tag
    if ( 'neoncrm-calendar' !== $handle ) {
        return $tag;
    }
    // change the script tag by adding type="module" and return it.
    $tag = '<script type="module" src="' . esc_url( $src ) . '"></script>';
    return $tag;
}
add_filter('script_loader_tag', 'add_type_attribute' , 10, 3);