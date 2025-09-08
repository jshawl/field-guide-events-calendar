<?php defined("ABSPATH") || exit(); ?>
<div class="field_guide_events_calendar_container"
	<?php foreach ($atts as $key => $value): ?>
		data-<?php echo esc_attr($key); ?>="<?php echo esc_attr($value); ?>"
	<?php endforeach; ?>
	style="
	--campaign_background_color: <?php _e($atts["campaign_background_color"]); ?>;
	--campaign_color: <?php _e($atts["campaign_color"]); ?>
	"
>
	<div class="field_guide_events_calendar_loading"></div>
	<div class="field_guide_events_calendar_campaigns"></div>
	<div class="field_guide_events_calendar_calendar"></div>
</div>
