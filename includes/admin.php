<?php
defined( 'ABSPATH' ) || exit;

/**
 * Admin settings, sanitization and settings page.
 */

function neoncrm_calendar_register_settings_link( $links ) {
	$links[] = '<a href="' .
		admin_url( 'options-general.php?page=neoncrm-calendar-settings' ) .
		'">' . __( 'Settings', 'neoncrm-calendar' ) . '</a>';
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( NEONCRM_CALENDAR_DIR . 'neoncrm-calendar.php' ), 'neoncrm_calendar_register_settings_link' );

function neoncrm_calendar_settings_init() {
	register_setting( 'neoncrm_calendar', 'neoncrm_calendar_options', 'neoncrm_calendar_sanitize_options' );

	add_settings_section(
		'neoncrm_calendar_section',
		'',
		'neoncrm_calendar_settings_header',
		'neoncrm_calendar'
	);

	add_settings_field(
		'neoncrm_org_id',
		__( 'Org ID', 'neoncrm-calendar' ),
		'neoncrm_calendar_text_input',
		'neoncrm_calendar',
		'neoncrm_calendar_section',
		array(
			'label_for' => 'neoncrm_org_id',
		)
	);

	add_settings_field(
		'neoncrm_api_key',
		__( 'API Key', 'neoncrm-calendar' ),
		'neoncrm_calendar_text_input',
		'neoncrm_calendar',
		'neoncrm_calendar_section',
		array(
			'label_for'   => 'neoncrm_api_key',
			'type'        => 'password',
			'description' => __( 'Enter your Neon CRM API key. Leave blank to keep the current key.', 'neoncrm-calendar' ),
		)
	);
}
add_action( 'admin_init', 'neoncrm_calendar_settings_init' );

function neoncrm_calendar_sanitize_options( $input ) {
	$options = get_option( 'neoncrm_calendar_options', array() );
	$output  = $options;

	if ( isset( $input['neoncrm_org_id'] ) ) {
		$output['neoncrm_org_id'] = sanitize_text_field( $input['neoncrm_org_id'] );
	}

	// For API key: only update if a non-empty value was submitted; otherwise preserve existing key.
	if ( isset( $input['neoncrm_api_key'] ) ) {
		$submitted = trim( $input['neoncrm_api_key'] );
		if ( '' !== $submitted ) {
			$output['neoncrm_api_key'] = sanitize_text_field( $submitted );
		} elseif ( isset( $options['neoncrm_api_key'] ) ) {
			$output['neoncrm_api_key'] = $options['neoncrm_api_key'];
		}
	}
	return $output;
}

function neoncrm_calendar_settings_header( $args ) {
	?>
	<p id="<?php echo esc_attr( $args['id'] ); ?>">
		<a href="https://developer.neoncrm.com/api/getting-started/api-keys/" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'View Neon API Keys Documentation', 'neoncrm-calendar' ); ?></a>
	</p>
	<?php
}

function neoncrm_calendar_text_input( $args ) {
	$options = get_option( 'neoncrm_calendar_options', array() );
	$value   = '';
	if ( isset( $options[ $args['label_for'] ] ) ) {
		$value = $options[ $args['label_for'] ];
	}

	$type = isset( $args['type'] ) ? $args['type'] : 'text';

	// For password fields, do not prefill the value attribute.
	$value_attr = ( 'password' === $type ) ? '' : $value;
	?>
	<input type="<?php echo esc_attr( $type ); ?>"
		   id="<?php echo esc_attr( $args['label_for'] ); ?>"
		   name="neoncrm_calendar_options[<?php echo esc_attr( $args['label_for'] ); ?>]"
		   value="<?php echo esc_attr( $value_attr ); ?>" />
	<?php
	if ( 'password' === $type && ! empty( $value ) ) {
		$len   = strlen( $value );
		$last4 = $len > 4 ? substr( $value, -4 ) : '';

		if ( $len > 4 ) {
			$masked = str_repeat( '*', max( 0, $len - 4 ) ) . $last4;
		} else {
			$masked = str_repeat( '*', $len );
		}

		/* translators: %s is the masked API key (asterisks + last 4 chars) */
		echo '<p class="description">' . sprintf( esc_html__( 'Current key: %s — leave blank to keep existing key.', 'neoncrm-calendar' ), esc_html( $masked ) ) . '</p>';
	}
}

function neoncrm_calendar_settings_html() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
		<form action="options.php" method="post">
			<?php
			settings_fields( 'neoncrm_calendar' );
			do_settings_sections( 'neoncrm_calendar' );
			submit_button( __( 'Save Settings', 'neoncrm-calendar' ) );
			?>
		</form>
	</div>
	<?php
}

function neoncrm_calendar_options_page() {
	add_options_page(
		__( 'Neon CRM Calendar Settings', 'neoncrm-calendar' ),
		__( 'Neon CRM Calendar', 'neoncrm-calendar' ),
		'manage_options',
		'neoncrm-calendar-settings',
		'neoncrm_calendar_settings_html'
	);
}
add_action( 'admin_menu', 'neoncrm_calendar_options_page' );
