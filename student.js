import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, addDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

const studentInfoArea = document.getElementById("studentInfoArea");
const proceedBtn = document.getElementById("proceedBtn");
const testSelectionArea = document.getElementById("testSelectionArea");
const testList = document.getElementById("testList");
const examArea = document.getElementById("examArea");
const testContainer = document.getElementById("testContainer");
const currentTestHeading = document.getElementById("currentTestHeading");
const submitTestBtn = document.getElementById("submitTestBtn");
const resultMessage = document.getElementById("resultMessage");
const backBtn = document.getElementById("backBtn");

let correctAnswers = {}; 
let totalQuestions = 0;
let currentTestName = "";
let studentNameVal = "";
let studentRollVal = "";

proceedBtn.addEventListener("click", () => {
    studentNameVal = document.getElementById("studentName").value;
    studentRollVal = document.getElementById("studentRoll").value.trim(); 

    if(studentNameVal === "" || studentRollVal === "") {
        document.getElementById("infoError").style.display = "block";
        return;
    }

    studentInfoArea.style.display = "none";
    testSelectionArea.style.display = "block";
    loadAvailableTests(); 
});

async function loadAvailableTests() {
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        testList.innerHTML = ""; 
        let uniqueTests = new Set(); 
        let testAccessMap = {}; 

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if(data.testName) {
                uniqueTests.add(data.testName);
                if(!testAccessMap[data.testName] && data.allowedRolls) {
                    testAccessMap[data.testName] = data.allowedRolls;
                }
            }
        });

        let testsShown = 0;
        uniqueTests.forEach(testName => {
            const allowedStr = testAccessMap[testName] || "";
            let isAllowed = true;
            if (allowedStr.trim() !== "") {
                const allowedArray = allowedStr.split(",").map(s => s.trim());
                if (!allowedArray.includes(studentRollVal)) isAllowed = false;
            }
            if (isAllowed) {
                const btn = document.createElement("button");
                btn.className = "test-btn";
                btn.innerText = testName;
                btn.onclick = () => startTest(testName);
                testList.appendChild(btn);
                testsShown++;
            }
        });

        if (testsShown === 0) {
            testList.innerHTML = "<p style='text-align:center; color:red;'>No tests available for your Roll Number.</p>";
        }
    } catch (error) {
        testList.innerHTML = "<p style='text-align:center; color:red;'>Error loading test list.</p>";
    }
}

async function startTest(selectedTestName) {
    currentTestName = selectedTestName;
    testSelectionArea.style.display = "none"; 
    examArea.style.display = "block"; 
    testContainer.style.display = "block"; 
    resultMessage.innerHTML = ""; 
    currentTestHeading.innerText = selectedTestName;
    testContainer.innerHTML = "<p style='text-align:center;'>Loading questions... ⏳</p>";

    try {
        const q = query(collection(db, "Tests"), where("testName", "==", selectedTestName));
        const querySnapshot = await getDocs(q);
        
        testContainer.innerHTML = "";
        correctAnswers = {};
        totalQuestions = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const qId = doc.id;
            const qNum = totalQuestions + 1;
            
            // अब हम सिर्फ सही जवाब ही नहीं, बल्कि पूरा सवाल भी सेव कर रहे हैं
            correctAnswers[qId] = { answer: data.answer, question: data.question }; 

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
        
        submitTestBtn.innerText = "Submit Test";
        submitTestBtn.disabled = false;
        submitTestBtn.style.display = "block";
    } catch (error) {
        testContainer.innerHTML = "<p style='text-align:center; color:red;'>Error loading questions.</p>";
    }
}

backBtn.addEventListener("click", () => {
    examArea.style.display = "none";
    testSelectionArea.style.display = "block";
});

submitTestBtn.addEventListener("click", async () => {
    submitTestBtn.innerText = "Submitting... ⏳";
    submitTestBtn.disabled = true;

    let score = 0;
    let detailedResponses = []; // नया: स्टूडेंट की पूरी आंसर शीट
    let qIndex = 1;

    for (let qId in correctAnswers) {
        const selectedOptionNode = document.querySelector(`input[name="${qId}"]:checked`);
        const selectedOption = selectedOptionNode ? selectedOptionNode.value : "Not Attempted";
        const correctAnswer = correctAnswers[qId].answer;

        if (selectedOption === correctAnswer) {
            score++;
        }

        // हर सवाल का डेटा तैयार करना
        detailedResponses.push({
            qNum: qIndex,
            question: correctAnswers[qId].question,
            selected: selectedOption,
            correct: correctAnswer
        });
        qIndex++;
    }

    try {
        await addDoc(collection(db, "Results"), {
            studentName: studentNameVal,
            rollNumber: studentRollVal,
            testName: currentTestName,
            score: score,
            totalMarks: totalQuestions,
            date: new Date().toLocaleString(),
            detailedResponses: detailedResponses // इस शीट को डेटाबेस में भेज रहे हैं
        });

        testContainer.style.display = "none";
        submitTestBtn.style.display = "none";
        resultMessage.innerHTML = `Test Submitted Successfully! 🎉<br>Your Score: ${score} out of ${totalQuestions}`;
    } catch(error) {
        alert("Error saving your result. Please try again.");
        submitTestBtn.innerText = "Submit Test";
        submitTestBtn.disabled = false;
    }
});
