<?php

class RestTest extends WP_UnitTestCase
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

    public function test_happy_path_list_events()
    {
        add_filter(
            "pre_http_request",
            function ($response, $args, $url) {
                if (strpos($url, "events") !== false) {
                    return [
                        "response" => ["code" => 200],
                        "body" => json_encode([
                            "events" => [
                                [
                                    "id" => 1,
                                    "name" => "Event 1",
                                    "startDate" => "2024-06-01",
                                    "endDate" => "2024-06-01",
                                ],
                            ],
                        ]),
                    ];
                }
                return new WP_Error(
                    "unexpected_url",
                    "Unexpected URL: " . $url,
                );
            },
            10,
            3,
        );

        $request = new WP_REST_Request(
            "GET",
            "/neon-crm-calendar/v1/listEvents",
        );

        $response = rest_do_request($request);
        $this->assertIsArray($response->data["events"]);
        $this->assertCount(1, $response->data["events"]);
    }

    public function test_happy_path_events()
    {
        add_filter(
            "pre_http_request",
            function ($response, $args, $url) {
                if (strpos($url, "events") !== false) {
                    return [
                        "response" => ["code" => 200],
                        "body" => json_encode([
                            "searchResults" => [
                                [
                                    "id" => 1,
                                    "name" => "Event 1",
                                    "startDate" => "2024-06-01",
                                    "endDate" => "2024-06-01",
                                ],
                            ],
                        ]),
                    ];
                }
                return new WP_Error(
                    "unexpected_url",
                    "Unexpected URL: " . $url,
                );
            },
            10,
            3,
        );
        $response = neon_crm_calendar_rest_get_events(new WP_REST_Request());
        $this->assertIsArray($response->data["searchResults"]);
        $this->assertCount(1, $response->data["searchResults"]);
    }

    public function test_api_key_error()
    {
        $options = update_option("neon_crm_calendar_options", [
            "neon_crm_api_key" => "",
            "neon_crm_org_id" => "org123",
        ]);
        $request = new WP_REST_Request(
            "GET",
            "/neon-crm-calendar/v1/listEvents",
        );
        $response = rest_do_request($request);
        $this->assertEquals("no_api_key", $response->data["code"]);
    }

    public function test_org_id_error()
    {
        $options = update_option("neon_crm_calendar_options", [
            "neon_crm_api_key" => "secret",
            "neon_crm_org_id" => "",
        ]);
        $request = new WP_REST_Request(
            "GET",
            "/neon-crm-calendar/v1/listEvents",
        );
        $response = rest_do_request($request);
        $this->assertEquals("no_org_id", $response->data["code"]);
    }
}
