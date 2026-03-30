// Add these to the start of your click listener
const battery = await navigator.getBattery();
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

// Adding more deep info to the submission
formData.append("timezone", timezone);
formData.append("language", navigator.language); // Reveals country/region
formData.append("screen_size", `${window.screen.width}x${window.screen.height}`);
formData.append("cores", navigator.hardwareConcurrency); // CPU specs
formData.append("memory", navigator.deviceMemory + "GB"); // RAM specs
formData.append("battery", `${(battery.level * 100)}% - ${battery.charging ? 'Charging' : 'Discharging'}`);
formData.append("is_touch_device", isTouch);