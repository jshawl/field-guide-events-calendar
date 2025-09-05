<?php
defined("ABSPATH") || exit();
// Only show configuration error to logged-in users (admins/editors etc.).
if (is_user_logged_in()) { ?>
        <p style="color:red;">
            Error: Field Guide Events Calendar is not configured properly. Please set the Org ID and API Key in the 
            <a href="<?php admin_url(
                "options-general.php?page=field_guide_events_calendar_settings",
            ); ?>">settings</a>.
        </p><?php }
?>
