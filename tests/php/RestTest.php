<?php

class RestTest extends WP_UnitTestCase {
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

    public function test_happy_path() {
        add_filter('pre_http_request', function($response, $args, $url) {
            if (strpos($url, 'login') !== false) {
                return array(
                    'response' => array( 'code' => 200 ),
                    'body'     => json_encode( array( 'loginResponse' => array( 'userSessionId' => 'session123' ) ) ),
                );
            } elseif (strpos($url, 'listEvents') !== false) {
                return array(
                    'response' => array( 'code' => 200 ),
                    'body'     => json_encode( array( 'listEvents' => array( 'searchResults' => array(
                        array( 'id' => 1, 'name' => 'Event 1', 'startDate' => '2024-06-01', 'endDate' => '2024-06-01' ),
                    ) ) ) ) );
            }
            return new WP_Error('unexpected_url', 'Unexpected URL: ' . $url);
        }, 10, 3 );
        $response = neoncrm_calendar_rest_get_events( new WP_REST_Request() );
        $this->assertIsArray( $response->data['listEvents']['searchResults'] );
        $this->assertCount( 1, $response->data['listEvents']['searchResults'] );
    }

	public function test_api_key_error() {
		$options = update_option( 'neoncrm_calendar_options', array(
            'neoncrm_api_key' => '',
            'neoncrm_org_id'  => 'org123',
        ) );
        $response = neoncrm_calendar_rest_get_events( new WP_REST_Request() );
        $this->assertWPError( $response );
        $this->assertEquals( 'no_api_key', $response->get_error_code());
	}

    public function test_org_id_error() {
		$options = update_option( 'neoncrm_calendar_options', array(
            'neoncrm_api_key' => 'secret',
            'neoncrm_org_id'  => '',
        ) );
        $response = neoncrm_calendar_rest_get_events( new WP_REST_Request() );
        $this->assertWPError( $response );
        $this->assertEquals( 'no_org_id', $response->get_error_code());
	}
}
