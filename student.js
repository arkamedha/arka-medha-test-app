import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
// यहाँ हमने query और where को भी इम्पोर्ट किया है ताकि हम सवालों को फ़िल्टर कर सकें
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

const testSelectionArea = document.getElementById("testSelectionArea");
const testList = document.getElementById("testList");
const examArea = document.getElementById("examArea");
const testContainer = document.getElementById("testContainer");
const currentTestHeading = document.getElementById("currentTestHeading");
const submitTestBtn = document.getElementById("submitTestBtn");
const resultMessage = document.getElementById("resultMessage");

let correctAnswers = {}; 
let totalQuestions = 0;

// 1. डेटाबेस से सारे उपलब्ध टेस्ट के नाम लाना
async function loadAvailableTests() {
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        testList.innerHTML = ""; 
        
        let uniqueTests = new Set(); // Set का उपयोग डुप्लीकेट नाम हटाने के लिए करते हैं

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.testName) {
                uniqueTests.add(data.testName);
            }
        });

        if (uniqueTests.size === 0) {
            testList.innerHTML = "<p style='text-align:center; color:red;'>No tests are live right now.</p>";
            return;
        }

        // हर टेस्ट के लिए एक बटन बनाना
        uniqueTests.forEach(testName => {
            const btn = document.createElement("button");
            btn.className = "test-btn";
            btn.innerText = testName;
            btn.onclick = () => startTest(testName); // क्लिक करने पर टेस्ट शुरू होगा
            testList.appendChild(btn);
        });

    } catch (error) {
        console.error("Error loading tests: ", error);
        testList.innerHTML = "<p style='text-align:center; color:red;'>Error loading test list.</p>";
    }
}

// 2. जब स्टूडेंट किसी टेस्ट पर क्लिक करे, तो सिर्फ उसके सवाल लाना
async function startTest(selectedTestName) {
    testSelectionArea.style.display = "none"; // टेस्ट लिस्ट छुपा दें
    examArea.style.display = "block"; // एग्जाम एरिया दिखाएँ
    currentTestHeading.innerText = selectedTestName;
    testContainer.innerHTML = "<p style='text-align:center;'>Loading questions... ⏳</p>";

    try {
        // यहाँ हम Firebase को बोल रहे हैं कि सिर्फ वही सवाल लाओ जिनका testName मैच करता हो
        const q = query(collection(db, "Tests"), where("testName", "==", selectedTestName));
        const querySnapshot = await getDocs(q);
        
        testContainer.innerHTML = "";
        correctAnswers = {};
        totalQuestions = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const qId = doc.id;
            const qNum = totalQuestions + 1;
            
            correctAnswers[qId] = data.answer; 

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

        submitTestBtn.style.display = "block";

    } catch (error) {
        console.error("Error fetching questions: ", error);
        testContainer.innerHTML = "<p style='text-align:center; color:red;'>Error loading questions.</p>";
    }
}

// पेज खुलते ही टेस्ट की लिस्ट लोड करें
loadAvailableTests();

// 3. टेस्ट सबमिट करने का लॉजिक
submitTestBtn.addEventListener("click", () => {
    let score = 0;
    for (let qId in correctAnswers) {
        const selectedOption = document.querySelector(`input[name="${qId}"]:checked`);
        if (selectedOption && selectedOption.value === correctAnswers[qId]) {
            score++;
        }
    }

    testContainer.style.display = "none";
    submitTestBtn.style.display = "none";
    resultMessage.innerHTML = `Test Submitted! 🎉<br>Your Score: ${score} out of ${totalQuestions}`;
});
