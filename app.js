// Firebase को इंटरनेट (CDN) से इम्पोर्ट कर रहे हैं
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// आपकी Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUG6LDNhB8kPW4fh8XURtIBb8ZpPNsM4w",
  authDomain: "arka-medha-test-app.firebaseapp.com",
  projectId: "arka-medha-test-app",
  storageBucket: "arka-medha-test-app.firebasestorage.app",
  messagingSenderId: "249649360234",
  appId: "1:249649360234:web:3fcd302e5115573caa8913"
};

// Firebase शुरू करें
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// HTML के बटन और इनपुट बॉक्स को जावास्क्रिप्ट से जोड़ना
const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageDisplay = document.getElementById("message");

// जब Login बटन पर क्लिक हो
loginBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    // चेक करें कि ईमेल और पासवर्ड खाली तो नहीं है
    if(email === "" || password === "") {
        messageDisplay.innerText = "Please enter both Email and Password!";
        messageDisplay.style.color = "red";
        return;
    }

    messageDisplay.innerText = "Logging in please wait...";
    messageDisplay.style.color = "blue";

    // Firebase से लॉगिन करने का कोड
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            messageDisplay.innerText = "Login Successful! ✅";
            window.location.href = "dashboard.html";
            messageDisplay.style.color = "green";
            console.log("Logged in user:", user.email);
            // अगले स्टेप में हम यहाँ से यूज़र को 'Test Dashboard' पर भेजेंगे
        })
        .catch((error) => {
            messageDisplay.innerText = "Error: Invalid Email or Password ❌";
            messageDisplay.style.color = "red";
            console.error(error.message);
        });
});
