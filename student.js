import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, addDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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
const auth = getAuth(app);

const studentInfoArea = document.getElementById("studentInfoArea");
const proceedBtn = document.getElementById("proceedBtn");
const testSelectionArea = document.getElementById("testSelectionArea");
const testList = document.getElementById("testList");
const securityArea = document.getElementById("securityArea");
const examArea = document.getElementById("examArea");
const testContainer = document.getElementById("testContainer");
const submitTestBtn = document.getElementById("submitTestBtn");

let currentTestName = "";
let studentNameVal = "";
let studentRollVal = "";
let correctAnswers = {}; 
let totalMaxMarks = 0; // नया: टोटल कितने नंबर का पेपर है
let timerInterval; 

let testAuthTypeMap = {}; 
let testPinMap = {}; 
let testDurationMap = {}; 

window.onload = () => {
    if (sessionStorage.getItem("savedStudentName") && sessionStorage.getItem("savedStudentRoll")) {
        studentNameVal = sessionStorage.getItem("savedStudentName");
        studentRollVal = sessionStorage.getItem("savedStudentRoll");
        studentInfoArea.style.display = "none";
        testSelectionArea.style.display = "block";
        loadAvailableTests(); 
    }
};

proceedBtn.addEventListener("click", () => {
    studentNameVal = document.getElementById("studentName").value;
    studentRollVal = document.getElementById("studentRoll").value.trim(); 
    if(studentNameVal === "" || studentRollVal === "") {
        document.getElementById("infoError").style.display = "block";
        return;
    }
    sessionStorage.setItem("savedStudentName", studentNameVal);
    sessionStorage.setItem("savedStudentRoll", studentRollVal);
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
                if(!testAccessMap[data.testName] && data.allowedRolls) testAccessMap[data.testName] = data.allowedRolls;
                if(!testAuthTypeMap[data.testName] && data.authType) testAuthTypeMap[data.testName] = data.authType;
                if(!testPinMap[data.testName] && data.testPin) testPinMap[data.testName] = data.testPin;
                if(!testDurationMap[data.testName] && data.testDuration) testDurationMap[data.testName] = data.testDuration;
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
                btn.onclick = () => handleTestClick(testName);
                testList.appendChild(btn);
                testsShown++;
            }
        });

        if (testsShown === 0) testList.innerHTML = "<p style='text-align:center; color:red;'>No tests available for your Roll Number.</p>";
    } catch (error) {
        testList.innerHTML = "<p style='text-align:center; color:red;'>Error loading test list.</p>";
    }
}

function handleTestClick(testName) {
    currentTestName = testName;
    const authType = testAuthTypeMap[testName] || "none";
    testSelectionArea.style.display = "none";
    document.getElementById("securityError").innerText = "";

    if (authType === "none") {
        startTest(testName); 
    } else if (authType === "pin") {
        securityArea.style.display = "block";
        document.getElementById("pinDiv").style.display = "block";
        document.getElementById("otpDiv").style.display = "none";
        document.getElementById("securityHeading").innerText = "Enter PIN to Unlock";
    } else if (authType === "otp") {
        securityArea.style.display = "block";
        document.getElementById("pinDiv").style.display = "none";
        document.getElementById("otpDiv").style.display = "block";
        document.getElementById("securityHeading").innerText = "Mobile OTP Verification";
    }
}

document.getElementById("verifyPinBtn").addEventListener("click", () => {
    if(document.getElementById("enteredPin").value === testPinMap[currentTestName]) {
        securityArea.style.display = "none";
        startTest(currentTestName);
    } else { document.getElementById("securityError").innerText = "Incorrect PIN! ❌"; }
});
document.getElementById("cancelSecurityBtn").addEventListener("click", () => {
    securityArea.style.display = "none"; testSelectionArea.style.display = "block";
});

function updateTimerUI(seconds) {
    let m = Math.floor(seconds / 60); let s = seconds % 60;
    document.getElementById("timeRemainingText").innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
}

async function startTest(selectedTestName) {
    examArea.style.display = "block"; 
    testContainer.style.display = "block"; 
    document.getElementById("resultMessage").innerHTML = ""; 
    document.getElementById("currentTestHeading").innerText = selectedTestName;
    testContainer.innerHTML = "<p style='text-align:center;'>Loading questions... ⏳</p>";
    
    clearInterval(timerInterval);
    document.getElementById("timerDisplay").style.display = "none";

    try {
        const q = query(collection(db, "Tests"), where("testName", "==", selectedTestName));
        const querySnapshot = await getDocs(q);
        
        testContainer.innerHTML = "";
        correctAnswers = {};
        totalMaxMarks = 0;
        let qIndex = 1;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const qId = doc.id;
            const qType = data.qType || "MCQ";
            const qMarks = data.marks || 1;
            
            correctAnswers[qId] = { answer: data.answer, question: data.question, marks: qMarks, type: qType }; 
            totalMaxMarks += qMarks; // टोटल मार्क्स में जोड़ रहे हैं

            let inputHTML = "";
            if(qType === "MCQ") {
                inputHTML = `
                    <label class="option-label"><input type="radio" name="${qId}" value="A"> ${data.options.A}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="B"> ${data.options.B}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="C"> ${data.options.C}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="D"> ${data.options.D}</label>
                `;
            } else {
                inputHTML = `<input type="text" id="subjAns_${qId}" class="subjective-input" placeholder="Type your answer here">`;
            }

            const questionHTML = `
                <div class="question-box">
                    <div class="question-text">Q${qIndex}. ${data.question}</div>
                    <div class="marks-badge">${qMarks} Marks</div>
                    ${inputHTML}
                </div>
            `;
            testContainer.innerHTML += questionHTML;
            qIndex++;
        });
        
        submitTestBtn.innerText = "Submit Test";
        submitTestBtn.disabled = false;
        submitTestBtn.style.display = "block";

        const durationStr = testDurationMap[selectedTestName];
        if (durationStr && parseInt(durationStr) > 0) {
            document.getElementById("timerDisplay").style.display = "block";
            let timeRemaining = parseInt(durationStr) * 60; 
            updateTimerUI(timeRemaining);
            timerInterval = setInterval(() => {
                timeRemaining--;
                updateTimerUI(timeRemaining);
                if (timeRemaining <= 0) {
                    clearInterval(timerInterval);
                    alert("⏱️ Time is up! Your test is being automatically submitted.");
                    submitTestBtn.click(); 
                }
            }, 1000);
        }

    } catch (error) {
        testContainer.innerHTML = "<p style='text-align:center; color:red;'>Error loading questions.</p>";
    }
}

document.getElementById("backBtn").addEventListener("click", () => {
    clearInterval(timerInterval); 
    examArea.style.display = "none";
    testSelectionArea.style.display = "block";
});

submitTestBtn.addEventListener("click", async () => {
    clearInterval(timerInterval); 
    submitTestBtn.innerText = "Submitting... ⏳";
    submitTestBtn.disabled = true;

    let score = 0;
    let detailedResponses = []; 
    let qIndex = 1;

    for (let qId in correctAnswers) {
        const qData = correctAnswers[qId];
        let selectedOption = "Not Attempted";

        if(qData.type === "MCQ") {
            const selectedOptionNode = document.querySelector(`input[name="${qId}"]:checked`);
            if(selectedOptionNode) selectedOption = selectedOptionNode.value;
        } else {
            const subjInput = document.getElementById(`subjAns_${qId}`);
            if(subjInput && subjInput.value.trim() !== "") {
                selectedOption = subjInput.value;
            }
        }

        const correctAnswer = qData.answer;
        
        // Subjective के लिए छोटे-बड़े अक्षर (Case) को माफ़ करना
        if (selectedOption.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
            score += qData.marks; // सिर्फ +1 नहीं, बल्कि असली मार्क्स जुड़ेंगे
        }

        detailedResponses.push({ 
            qNum: qIndex, question: qData.question, 
            selected: selectedOption, correct: correctAnswer, 
            marks: qData.marks, qType: qData.type 
        });
        qIndex++;
    }

    try {
        await addDoc(collection(db, "Results"), {
            studentName: studentNameVal, rollNumber: studentRollVal, testName: currentTestName,
            score: score, totalMarks: totalMaxMarks, date: new Date().toLocaleString(), detailedResponses: detailedResponses
        });

        testContainer.style.display = "none";
        submitTestBtn.style.display = "none";
        document.getElementById("timerDisplay").style.display = "none"; 
        document.getElementById("resultMessage").innerHTML = `Test Submitted Successfully! 🎉<br>Your Score: ${score} / ${totalMaxMarks} Marks`;
    } catch(error) {
        alert("Error saving your result. Please try again.");
        submitTestBtn.innerText = "Submit Test";
        submitTestBtn.disabled = false;
    }
});
