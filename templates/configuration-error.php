<?php
    // Only show configuration error to logged-in users (admins/editors etc.).
    if ( is_user_logged_in() ) { ?>
        <p style="color:red;">
            Error: Neon CRM Calendar is not configured properly. Please set the Org ID and API Key in the 
            <a href="<?php admin_url( 'options-general.php?page=neoncrm-calendar-settings' );?>">settings</a>.
        </p><?php 
    }
?>