<?php

/**
 * Sample test case.
 */

class AdminTest extends WP_UnitTestCase {
 	public function setUp(): void {
        parent::setUp();
         update_option( 'neoncrm_calendar_options', array(
            'neoncrm_api_key' => 'secret',
            'neoncrm_org_id'  => 'org123',
        ) );
    }

    public function tearDown(): void {
        delete_option( 'neoncrm_calendar_options' );
        parent::tearDown();
    }

	public function test_sanitize_options_ignores_empty_api_key() {
		$options = neoncrm_calendar_sanitize_options( array(
			'neoncrm_org_id'  => 'org123',
			'neoncrm_api_key' => '')
		);
		$this->assertStringContainsString( $options['neoncrm_api_key'], 'secret' );
	}

	public function test_text_input_does_not_expose_api_key() {
		ob_start();
		neoncrm_calendar_text_input( array(
			'label_for'   => 'neoncrm_api_key',
			'type'        => 'password',
			'description' => 'Enter your Neon CRM API key. Leave blank to keep the current key.',
		) );
		$output = ob_get_clean();
		$this->assertStringContainsString( 'value=""', $output );
	}
}
