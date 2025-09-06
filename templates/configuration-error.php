<?php
defined("ABSPATH") || exit();
// Only show configuration error to logged-in users (admins/editors etc.).
if (is_user_logged_in()) { ?>
    <p style="color:red;">
        <?php printf(
            /* translators: %s: Settings page link */
            esc_html__(
                "Error: Field Guide Events Calendar is not configured properly. Please set the Org ID and API Key in the %s.",
                "field-guide-events-calendar",
            ),
            sprintf(
                '<a href="%s">%s</a>',
                esc_url(
                    admin_url(
                        "options-general.php?page=field-guide-events-calendar_settings",
                    ),
                ),
                /* translators: Link text for the settings page */
                esc_html__("settings", "field-guide-events-calendar"),
            ),
        ); ?>
    </p>
<?php } ?>
