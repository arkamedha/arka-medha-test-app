// Firebase और Firestore को इम्पोर्ट करना
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// आपकी Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBUG6LDNhB8kPW4fh8XURtIBb8ZpPNsM4w",
    authDomain: "arka-medha-test-app.firebaseapp.com",
    projectId: "arka-medha-test-app",
    storageBucket: "arka-medha-test-app.firebasestorage.app",
    messagingSenderId: "249649360234",
    appId: "1:249649360234:web:3fcd302e5115573caa8913"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testContainer = document.getElementById("testContainer");
const submitTestBtn = document.getElementById("submitTestBtn");
const resultMessage = document.getElementById("resultMessage");

let correctAnswers = {}; // सही उत्तरों को यहाँ सेव करेंगे
let totalQuestions = 0;

// डेटाबेस से क्वेश्चंस लाने का फंक्शन
async function fetchQuestions() {
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        testContainer.innerHTML = ""; // Loading text हटा दें

        if (querySnapshot.empty) {
            testContainer.innerHTML = "<p style='text-align:center; color:red;'>No test is live right now.</p>";
            return;
        }

        querySnapshot.forEach((doc, index) => {
            const data = doc.data();
            const qId = doc.id;
            const qNum = totalQuestions + 1;
            
            // सही उत्तर को सेव कर लें (बाद में चेक करने के लिए)
            correctAnswers[qId] = data.answer; 

            // क्वेश्चन को स्क्रीन पर दिखाना
            const questionHTML = `
                <div class="question-box">
                    <div class="question-text">Q${qNum}. ${data.question}</div>
                    <label class="option-label"><input type="radio" name="${qId}" value="A"> ${data.options.A}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="B"> ${data.options.B}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="C"> ${data.options.C}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="D"> ${data.options.D}</label>
                </div>
            `;
            testContainer.innerHTML += questionHTML;
            totalQuestions++;
        });

        // क्वेश्चन आने के बाद Submit बटन दिखाएँ
        submitTestBtn.style.display = "block";

    } catch (error) {
        console.error("Error fetching test: ", error);
        testContainer.innerHTML = "<p style='text-align:center; color:red;'>Error loading test.</p>";
    }
}

// पेज खुलते ही क्वेश्चंस लोड करें
fetchQuestions();

// जब स्टूडेंट Test Submit करे
submitTestBtn.addEventListener("click", () => {
    let score = 0;

    // चेक करें कि स्टूडेंट ने कौन से ऑप्शन सिलेक्ट किए हैं
    for (let qId in correctAnswers) {
        const selectedOption = document.querySelector(`input[name="${qId}"]:checked`);
        if (selectedOption && selectedOption.value === correctAnswers[qId]) {
            score++;
        }
    }

    // रिजल्ट स्क्रीन पर दिखाना
    testContainer.style.display = "none";
    submitTestBtn.style.display = "none";
    resultMessage.innerHTML = `Test Submitted! 🎉<br>Your Score: ${score} out of ${totalQuestions}`;
});
