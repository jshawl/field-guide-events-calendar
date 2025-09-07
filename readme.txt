=== Field Guide Events Calendar ===
Contributors: jshawl
Stable tag: 1.3.0
Tested up to: 6.8
Requires at least: 6.0
License: GPLv2 or later

A plugin to display a filterable calendar of events with initial support for Neon CRM.

== Description ==

A plugin to display a filterable calendar of events with initial support for Neon CRM.

== Usage ==

Add a short code to any page or post to display a calendar of upcoming events:

`[field_guide_events_calendar]`

Additional attributes are available:
- `filter_campaigns="true"`
  - filters events by campaign name
- `multi_day_events="false"`
  - uses the start date only for dates that span multiple days

== Installation ==

Install the plugin and configure the Org ID and Api Key in Settings > Field Guide Events Calendar.

Information about the Org ID and Api Key are available on [Neon's developer site](https://developer.neoncrm.com/api/getting-started/api-keys/).

== External services ==

This plugin connects to an API to obtain events; it's needed to show the
events on the calendar every time the included shortcode is loaded. It does not collect any user information. Site administrators supply an organization id
and an api key to authenticate with the API. This service is provided by "Neon CRM": [terms of service](https://neonone.com/product-terms/)
[privacy policy](https://neonone.com/privacypolicy/)

== Changelog ==

= [1.3.0] 2025-09-07 =

* Preserve campaign filter on date change

= [1.2.0] 2025-09-06 =

* Fix admin localization strings

= [1.1.0] 2025-09-04 =

* Added `multi_day_events` attribute 
* Uses campaign names for filtering instead of categories

= [1.0.0] 2025-09-01 =

* Initial release 