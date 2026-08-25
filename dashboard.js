// Firebase और Firestore को इम्पोर्ट करना
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// आपकी वही Firebase Configuration 
const firebaseConfig = {
    apiKey: "AIzaSyBUG6LDNhB8kPW4fh8XURtIBb8ZpPNsM4w",
    authDomain: "arka-medha-test-app.firebaseapp.com",
    projectId: "arka-medha-test-app",
    storageBucket: "arka-medha-test-app.firebasestorage.app",
    messagingSenderId: "249649360234",
    appId: "1:249649360234:web:3fcd302e5115573caa8913"
};

// Firebase और Database शुरू करें
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// HTML बटन को जोड़ना
const publishBtn = document.getElementById("publishBtn");
const statusMessage = document.getElementById("statusMessage");

publishBtn.addEventListener("click", async () => {
    // फॉर्म से डेटा उठाना
    const testName = document.getElementById("testName").value;
    const questionText = document.getElementById("questionText").value;
    const optA = document.getElementById("optA").value;
    const optB = document.getElementById("optB").value;
    const optC = document.getElementById("optC").value;
    const optD = document.getElementById("optD").value;
    const correctOption = document.getElementById("correctOption").value;

    if (!testName || !questionText || !optA || !optB || !optC || !optD) {
        statusMessage.innerText = "Please fill all fields! ❌";
        statusMessage.style.color = "red";
        return;
    }

    statusMessage.innerText = "Saving to Database... ⏳";
    statusMessage.style.color = "blue";

    try {
        // डेटाबेस के "Tests" कलेक्शन में डेटा सेव करना
        await addDoc(collection(db, "Tests"), {
            testName: testName,
            question: questionText,
            options: { A: optA, B: optB, C: optC, D: optD },
            answer: correctOption,
            timestamp: new Date()
        });

        statusMessage.innerText = "Question Published Successfully! ✅";
        statusMessage.style.color = "green";
        
        // फॉर्म को खाली करना ताकि अगला क्वेश्चन डाल सकें
        document.getElementById("questionText").value = "";
        document.getElementById("optA").value = "";
        document.getElementById("optB").value = "";
        document.getElementById("optC").value = "";
        document.getElementById("optD").value = "";

    } catch (error) {
        console.error("Error saving document: ", error);
        statusMessage.innerText = "Error saving question! ❌";
        statusMessage.style.color = "red";
    }
});
