<?php

class EnqueueTest extends WP_UnitTestCase {
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
	
    public function test_shortcode_is_registered() {
        global $shortcode_tags;
        $this->assertArrayHasKey('neoncrm_calendar', $shortcode_tags);
    }

    public function test_calendar_shortcode_renders() {
        $output = do_shortcode('[neoncrm_calendar]');
        $this->assertNotEmpty($output);
        $this->assertStringContainsString('<div class="neoncrm-calendar">', $output);
    }

    public function test_suppressed_config_errors_if_not_logged_in() {
        delete_option( 'neoncrm_calendar_options' );
        update_option( 'neoncrm_calendar_options', array(
            'neoncrm_api_key' => '',
            'neoncrm_org_id'  => 'org123',
        ) );
        $value = get_option('neoncrm_calendar_options');
        $this->assertEquals('', $value['neoncrm_api_key']);
        $output = do_shortcode('[neoncrm_calendar]');
        $this->assertEquals( '', $output );
	}

    public function test_shows_config_errors_if_logged_in() {
        wp_set_current_user( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
        delete_option( 'neoncrm_calendar_options' );
        update_option( 'neoncrm_calendar_options', array(
            'neoncrm_api_key' => '',
            'neoncrm_org_id'  => 'org123',
        ) );
        $output = do_shortcode('[neoncrm_calendar]');
        $this->assertStringContainsString('Error: Neon CRM Calendar is not configured properly.', $output);
    }

    public function test_filter_categories_atts() {
        $this->assertStringNotContainsString(
            '<div class="categories">',
            do_shortcode('[neoncrm_calendar]')
        );
        $this->assertStringNotContainsString(
            '<div class="categories">',
            do_shortcode('[neoncrm_calendar filter_categories="false"]')
        );
        $this->assertStringContainsString(
            '<div class="categories">',
            do_shortcode('[neoncrm_calendar filter_categories="true"]')
        );
    }
}
