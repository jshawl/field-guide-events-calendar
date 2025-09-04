<?php
// Only show configuration error to logged-in users (admins/editors etc.).
if (is_user_logged_in()) { ?>
        <p style="color:red;">
            Error: Campaign Calendar is not configured properly. Please set the Org ID and API Key in the 
            <a href="<?php admin_url(
                "options-general.php?page=campaign_calendar_settings",
            ); ?>">settings</a>.
        </p><?php }
?>
