<?php

class AdminTest extends WP_UnitTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        update_option("campaign_calendar_options", [
            "neon_crm_api_key" => "secret",
            "neon_crm_org_id" => "org123",
        ]);
    }

    public function tearDown(): void
    {
        delete_option("campaign_calendar_options");
        parent::tearDown();
    }

    public function test_sanitize_options_ignores_empty_api_key()
    {
        $options = campaign_calendar_sanitize_options([
            "neon_crm_org_id" => "org123",
            "neon_crm_api_key" => "",
        ]);
        $this->assertStringContainsString(
            $options["neon_crm_api_key"],
            "secret",
        );
        $other_options = campaign_calendar_sanitize_options([
            "neon_crm_org_id" => "org123",
            "neon_crm_api_key" => "newkey",
        ]);
        $this->assertStringContainsString(
            $other_options["neon_crm_api_key"],
            "newkey",
        );
    }

    public function test_text_input_does_not_expose_api_key()
    {
        ob_start();
        campaign_calendar_text_input([
            "label_for" => "neon_crm_api_key",
            "type" => "password",
        ]);
        $output = ob_get_clean();
        $this->assertStringContainsString('value=""', $output);
        $this->assertStringContainsString("**cret", $output);
    }

    public function test_admin_init_integration()
    {
        wp_set_current_user(
            $this->factory->user->create(["role" => "administrator"]),
        );
        $this->assertNotFalse(
            has_action("admin_init", "campaign_calendar_settings_init"),
        );
        ob_start();
        campaign_calendar_settings_init();
        do_settings_sections("campaign_calendar");
        campaign_calendar_settings_html();
        $output = ob_get_clean();
        $this->assertStringContainsString(
            'name="campaign_calendar_options[neon_crm_api_key]"',
            $output,
        );
        $this->assertStringContainsString(
            'name="campaign_calendar_options[neon_crm_org_id]"',
            $output,
        );
    }
}
