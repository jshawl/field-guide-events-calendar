<div class="neon-crm-calendar"
	<?php foreach ($atts as $key => $value): ?>
		data-<?php echo esc_attr($key); ?>="<?php echo esc_attr($value); ?>"
	<?php endforeach; ?>
>
	<div class="loading"></div>
	<div class="categories"></div>
	<div id="calendar"></div>
</div>
