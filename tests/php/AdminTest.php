<?php

class AdminTest extends WP_UnitTestCase
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

    public function test_sanitize_options_ignores_empty_api_key()
    {
        $options = neon_crm_calendar_sanitize_options([
            "neon_crm_org_id" => "org123",
            "neon_crm_api_key" => "",
        ]);
        $this->assertStringContainsString(
            $options["neon_crm_api_key"],
            "secret",
        );
        $other_options = neon_crm_calendar_sanitize_options([
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
        neon_crm_calendar_text_input([
            "label_for" => "neon_crm_api_key",
            "type" => "password",
        ]);
        $output = ob_get_clean();
        $this->assertStringContainsString('value=""', $output);
        $this->assertStringContainsString("**cret", $output);
    }
}
