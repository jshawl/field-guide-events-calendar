<?php

class EnqueueTest extends WP_UnitTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        update_option("neon_crm_calendar_options", [
            "neon_crm_api_key" => "secret",
            "neon_crm_org_id" => "org123",
        ]);
    }

    public function tearDown(): void
    {
        delete_option("neon_crm_calendar_options");
        parent::tearDown();
    }

    public function test_shortcode_is_registered()
    {
        global $shortcode_tags;
        $this->assertArrayHasKey("neon_crm_calendar", $shortcode_tags);
    }

    public function test_calendar_shortcode_renders()
    {
        $output = do_shortcode("[neon_crm_calendar]");
        $this->assertNotEmpty($output);
        $this->assertStringContainsString(
            '<div class="neon-crm-calendar">',
            $output,
        );
    }

    public function test_suppressed_config_errors_if_not_logged_in()
    {
        delete_option("neon_crm_calendar_options");
        update_option("neon_crm_calendar_options", [
            "neon_crm_api_key" => "",
            "neon_crm_org_id" => "org123",
        ]);
        $value = get_option("neon_crm_calendar_options");
        $this->assertEquals("", $value["neon_crm_api_key"]);
        $output = do_shortcode("[neon_crm_calendar]");
        $this->assertEquals("", $output);
    }

    public function test_shows_config_errors_if_logged_in()
    {
        wp_set_current_user(
            $this->factory->user->create(["role" => "administrator"]),
        );
        delete_option("neon_crm_calendar_options");
        update_option("neon_crm_calendar_options", [
            "neon_crm_api_key" => "",
            "neon_crm_org_id" => "org123",
        ]);
        $output = do_shortcode("[neon_crm_calendar]");
        $this->assertStringContainsString(
            "Error: Neon CRM Calendar is not configured properly.",
            $output,
        );
    }

    public function test_filter_categories_atts()
    {
        $this->assertStringNotContainsString(
            '<div class="categories">',
            do_shortcode("[neon_crm_calendar]"),
        );
        $this->assertStringNotContainsString(
            '<div class="categories">',
            do_shortcode('[neon_crm_calendar filter_categories="false"]'),
        );
        $this->assertStringContainsString(
            '<div class="categories">',
            do_shortcode('[neon_crm_calendar filter_categories="true"]'),
        );
    }
}
