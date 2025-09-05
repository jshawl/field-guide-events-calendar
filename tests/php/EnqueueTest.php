<?php

class EnqueueTest extends WP_UnitTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        update_option("field_guide_events_calendar_options", [
            "neon_crm_api_key" => "secret",
            "neon_crm_org_id" => "org123",
        ]);
    }

    public function tearDown(): void
    {
        delete_option("field_guide_events_calendar_options");
        parent::tearDown();
    }

    public function test_shortcode_is_registered()
    {
        global $shortcode_tags;
        $this->assertArrayHasKey(
            "field_guide_events_calendar",
            $shortcode_tags,
        );
    }

    public function test_calendar_shortcode_renders()
    {
        $output = do_shortcode("[field_guide_events_calendar]");
        $this->assertNotEmpty($output);
        $this->assertStringContainsString(
            '<div class="field_guide_events_calendar"',
            $output,
        );
    }

    public function test_suppressed_config_errors_if_not_logged_in()
    {
        delete_option("field_guide_events_calendar_options");
        update_option("field_guide_events_calendar_options", [
            "neon_crm_api_key" => "",
            "neon_crm_org_id" => "org123",
        ]);
        $value = get_option("field_guide_events_calendar_options");
        $this->assertEquals("", $value["neon_crm_api_key"]);
        $output = do_shortcode("[field_guide_events_calendar]");
        $this->assertEquals("", $output);
    }

    public function test_shows_config_errors_if_logged_in()
    {
        wp_set_current_user(
            $this->factory->user->create(["role" => "administrator"]),
        );
        delete_option("field_guide_events_calendar_options");
        update_option("field_guide_events_calendar_options", [
            "neon_crm_api_key" => "",
            "neon_crm_org_id" => "org123",
        ]);
        $output = do_shortcode("[field_guide_events_calendar]");
        $this->assertStringContainsString(
            "Error: Field Guide Events Calendar is not configured properly.",
            $output,
        );
    }
    public function test_dom_atts()
    {
        $this->assertStringContainsString(
            'data-filter_campaigns="true"',
            do_shortcode(
                '[field_guide_events_calendar filter_campaigns="true"]',
            ),
        );
        $this->assertStringContainsString(
            'data-multi_day_events="false"',
            do_shortcode(
                '[field_guide_events_calendar multi_day_events="false"]',
            ),
        );
    }

    public function test_scripts_load_on_frontend()
    {
        $this->go_to(home_url());
        do_action("wp_enqueue_scripts");
        ob_start();
        wp_print_scripts();
        $output = ob_get_clean();
        $this->assertStringContainsString(
            "window.field_guide_events_calendar =",
            $output,
        );
        $this->assertStringContainsString('<script type="module"', $output);
    }
}
