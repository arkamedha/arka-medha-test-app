import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBUG6LDNhB8kPW4fh8XURtIBb8ZpPNsM4w",
  authDomain: "arka-medha-test-app.firebaseapp.com",
  projectId: "arka-medha-test-app",
  storageBucket: "arka-medha-test-app.firebasestorage.app",
  messagingSenderId: "249649360234",
  appId: "1:249649360234:web:3fcd302e5115573caa8913"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginBtn = document.getElementById("loginBtn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const messageDisplay = document.getElementById("message");

loginBtn.addEventListener("click", () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    if(email === "" || password === "") {
        messageDisplay.innerText = "Please enter both Email and Password!";
        messageDisplay.style.color = "red";
        return;
    }

    messageDisplay.innerText = "Logging in please wait...";
    messageDisplay.style.color = "blue";

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            messageDisplay.innerText = "Login Successful! ✅";
            messageDisplay.style.color = "green";
            window.location.href = "dashboard.html";
        })
        .catch((error) => {
            messageDisplay.innerText = "Error: Invalid Email or Password ❌";
            messageDisplay.style.color = "red";
        });
});
