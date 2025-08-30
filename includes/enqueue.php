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

	wp_register_script(
		'neoncrm-calendar',
		$plugin_url . 'assets/js/script.js',
		array( 'jquery' ),
		file_exists( $js_file ) ? filemtime( $js_file ) : null,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'neoncrm_calendar_register_assets' );

/**
 * Localize the script after registration so REST URL is available to the frontend.
 */
add_action( 'wp_enqueue_scripts', function() {
	if ( wp_script_is( 'neoncrm-calendar', 'registered' ) ) {
		wp_localize_script(
			'neoncrm-calendar',
			'neoncrm_calendar',
			array(
				'rest_url' => esc_url_raw( rest_url( 'neoncrm-calendar/v1/events' ) ),
			)
		);
	}
}, 11 );

/**
 * Shortcode that enqueues the assets and prints a container for the calendar.
 */
function neoncrm_calendar_shortcode( $atts ) {
	wp_enqueue_style( 'neoncrm-calendar' );
	wp_enqueue_script( 'neoncrm-calendar' );
	return '<div class="neoncrm-calendar">Calendar will be displayed here</div>';
}
add_shortcode( 'neoncrm_calendar', 'neoncrm_calendar_shortcode' );
