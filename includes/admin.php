<?php
defined("ABSPATH") || exit();

/**
 * Admin settings, sanitization and settings page.
 */

function neon_crm_calendar_register_settings_link($links)
{
    $links[] =
        '<a href="' .
        admin_url("options-general.php?page=neon-crm-calendar-settings") .
        '">' .
        __("Settings", "neon-crm-calendar") .
        "</a>";
    return $links;
}
add_filter(
    "plugin_action_links_" .
        plugin_basename(NEON_CRM_CALENDAR_DIR . "neon-crm-calendar.php"),
    "neon_crm_calendar_register_settings_link",
);

function neon_crm_calendar_settings_init()
{
    register_setting(
        "neon_crm_calendar",
        "neon_crm_calendar_options",
        "neon_crm_calendar_sanitize_options",
    );

    add_settings_section(
        "neon_crm_calendar_section",
        "",
        "neon_crm_calendar_settings_header",
        "neon_crm_calendar",
    );

    add_settings_field(
        "neon_crm_org_id",
        __("Org ID", "neon-crm-calendar"),
        "neon_crm_calendar_text_input",
        "neon_crm_calendar",
        "neon_crm_calendar_section",
        [
            "label_for" => "neon_crm_org_id",
        ],
    );

    add_settings_field(
        "neon_crm_api_key",
        __("API Key", "neon-crm-calendar"),
        "neon_crm_calendar_text_input",
        "neon_crm_calendar",
        "neon_crm_calendar_section",
        [
            "label_for" => "neon_crm_api_key",
            "type" => "password",
            "description" => __(
                "Enter your Neon CRM API key. Leave blank to keep the current key.",
                "neon-crm-calendar",
            ),
        ],
    );
}
add_action("admin_init", "neon_crm_calendar_settings_init");

function neon_crm_calendar_sanitize_options($input)
{
    $options = get_option("neon_crm_calendar_options", []);
    $output = $options;

    if (isset($input["neon_crm_org_id"])) {
        $output["neon_crm_org_id"] = sanitize_text_field(
            $input["neon_crm_org_id"],
        );
    }

    // For API key: only update if a non-empty value was submitted; otherwise preserve existing key.
    if (isset($input["neon_crm_api_key"])) {
        $submitted = trim($input["neon_crm_api_key"]);
        if ("" !== $submitted) {
            $output["neon_crm_api_key"] = sanitize_text_field($submitted);
        } elseif (isset($options["neon_crm_api_key"])) {
            $output["neon_crm_api_key"] = $options["neon_crm_api_key"];
        }
    }
    return $output;
}

function neon_crm_calendar_settings_header($args)
{
    ?>
	<p id="<?php echo esc_attr($args["id"]); ?>">
		<a href="https://developer.neoncrm.com/api/getting-started/api-keys/" target="_blank" rel="noopener noreferrer"><?php esc_html_e(
      "View Neon API Keys Documentation",
      "neon-crm-calendar",
  ); ?></a>
	</p>
	<?php
}

function neon_crm_calendar_text_input($args)
{
    $options = get_option("neon_crm_calendar_options", []);
    $value = "";
    if (isset($options[$args["label_for"]])) {
        $value = $options[$args["label_for"]];
    }

    $type = isset($args["type"]) ? $args["type"] : "text";

    // For password fields, do not prefill the value attribute.
    $value_attr = "password" === $type ? "" : $value;
    ?>
	<input type="<?php echo esc_attr($type); ?>"
		   id="<?php echo esc_attr($args["label_for"]); ?>"
		   name="neon_crm_calendar_options[<?php echo esc_attr($args["label_for"]); ?>]"
		   value="<?php echo esc_attr($value_attr); ?>" />
	<?php if ("password" === $type && !empty($value)) {
     $len = strlen($value);
     $last4 = $len > 4 ? substr($value, -4) : "";

     if ($len > 4) {
         $masked = str_repeat("*", max(0, $len - 4)) . $last4;
     } else {
         $masked = str_repeat("*", $len);
     }

     echo '<p class="description">' .
         sprintf(
             /* translators: %s is the masked API key (asterisks + last 4 chars) */
             esc_html__(
                 "Current key: %s — leave blank to keep existing key.",
                 "neon-crm-calendar",
             ),
             esc_html($masked),
         ) .
         "</p>";
 }
}

function neon_crm_calendar_settings_html()
{
    if (!current_user_can("manage_options")) {
        return;
    } ?>
	<div class="wrap">
		<h1><?php echo esc_html(get_admin_page_title()); ?></h1>
		<form action="options.php" method="post">
			<?php
   settings_fields("neon_crm_calendar");
   do_settings_sections("neon_crm_calendar");
   submit_button(__("Save Settings", "neon-crm-calendar"));?>
		</form>
	</div>
	<?php
}

function neon_crm_calendar_options_page()
{
    add_options_page(
        __("Neon CRM Calendar Settings", "neon-crm-calendar"),
        __("Neon CRM Calendar", "neon-crm-calendar"),
        "manage_options",
        "neon-crm-calendar-settings",
        "neon_crm_calendar_settings_html",
    );
}
add_action("admin_menu", "neon_crm_calendar_options_page");
