<?php defined("ABSPATH") || exit(); ?>
<div class="field_guide_events_calendar_container"
	<?php foreach ($atts as $key => $value): ?>
		data-<?php echo esc_attr($key); ?>="<?php echo esc_attr($value); ?>"
	<?php endforeach; ?>
	data-rest_url="<?php echo esc_url_raw(
     rest_url("field_guide_events_calendar/v1"),
 ); ?>"
	data-org_id="<?php echo esc_attr(
     field_guide_events_calendar_get_option("neon_crm_org_id", ""),
 ); ?>"
>
	<div class="field_guide_events_calendar_loading"></div>
	<div class="field_guide_events_calendar_campaigns"></div>
	<div class="field_guide_events_calendar_calendar"></div>
</div>
