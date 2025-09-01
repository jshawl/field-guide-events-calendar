#!/bin/sh

plugin_version=$(cat neon-crm-calendar.php | grep 'Version:' | sed 's/Version: //')
readme_version=$(cat readme.txt | grep '^Stable tag:' | sed 's/Stable tag: //')
package_version=$(cat package.json | grep '"version":' | sed 's/.*"version": "//;s/".*//')
echo "🆕 Plugin version: $plugin_version"
errors=0

if [ "$plugin_version" != "$readme_version" ]; then
  echo "❌ Error: Plugin version and readme version do not match."
  errors=1
else
  echo "✅ Readme version: $readme_version"
fi

if [ "$plugin_version" != "$package_version" ]; then
  echo "❌ Error: Plugin version and package version do not match."
  errors=1
else
  echo "✅ Package version: $package_version"
fi

if [ $errors -eq 0 ]; then
  echo "🎉 All versions match!"
  exit 0
else
  echo "❌ One or more version mismatches found."
  exit 1
fi
