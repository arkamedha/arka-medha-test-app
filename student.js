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

let currentTestName = ""; let studentNameVal = ""; let studentRollVal = "";
let correctAnswers = {}; let totalMaxMarks = 0; let timerInterval; 
let testAuthTypeMap = {}; let testPinMap = {}; let testDurationMap = {}; 

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
    if(studentNameVal === "" || studentRollVal === "") { document.getElementById("infoError").style.display = "block"; return; }
    sessionStorage.setItem("savedStudentName", studentNameVal);
    sessionStorage.setItem("savedStudentRoll", studentRollVal);
    studentInfoArea.style.display = "none";
    testSelectionArea.style.display = "block";
    loadAvailableTests(); 
});

async function loadAvailableTests() {
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        testList.innerHTML = ""; let uniqueTests = new Set(); let testAccessMap = {}; 
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
            const allowedStr = testAccessMap[testName] || ""; let isAllowed = true;
            if (allowedStr.trim() !== "") {
                const allowedArray = allowedStr.split(",").map(s => s.trim());
                if (!allowedArray.includes(studentRollVal)) isAllowed = false;
            }
            if (isAllowed) {
                const btn = document.createElement("button"); btn.className = "test-btn";
                btn.innerText = testName; btn.onclick = () => handleTestClick(testName);
                testList.appendChild(btn); testsShown++;
            }
        });
        if (testsShown === 0) testList.innerHTML = "<p style='text-align:center; color:red;'>No tests available.</p>";
    } catch (error) { testList.innerHTML = "<p style='text-align:center; color:red;'>Error loading list.</p>"; }
}

function handleTestClick(testName) {
    currentTestName = testName; const authType = testAuthTypeMap[testName] || "none";
    testSelectionArea.style.display = "none"; document.getElementById("securityError").innerText = "";
    if (authType === "none") startTest(testName); 
    else if (authType === "pin") {
        securityArea.style.display = "block"; document.getElementById("pinDiv").style.display = "block";
        document.getElementById("otpDiv").style.display = "none"; document.getElementById("securityHeading").innerText = "Enter PIN to Unlock";
    } else if (authType === "otp") {
        securityArea.style.display = "block"; document.getElementById("pinDiv").style.display = "none";
        document.getElementById("otpDiv").style.display = "block"; document.getElementById("securityHeading").innerText = "Mobile OTP Verification";
    }
}

document.getElementById("verifyPinBtn").addEventListener("click", () => {
    if(document.getElementById("enteredPin").value === testPinMap[currentTestName]) {
        securityArea.style.display = "none"; startTest(currentTestName);
    } else { document.getElementById("securityError").innerText = "Incorrect PIN! ❌"; }
});
document.getElementById("cancelSecurityBtn").addEventListener("click", () => { securityArea.style.display = "none"; testSelectionArea.style.display = "block"; });

function updateTimerUI(seconds) {
    let m = Math.floor(seconds / 60); let s = seconds % 60;
    document.getElementById("timeRemainingText").innerText = `${m}:${s < 10 ? '0' : ''}${s}`;
}

async function startTest(selectedTestName) {
    examArea.style.display = "block"; testContainer.style.display = "block"; 
    document.getElementById("resultMessage").innerHTML = ""; 
    document.getElementById("currentTestHeading").innerText = selectedTestName;
    testContainer.innerHTML = "<p style='text-align:center;'>Loading questions... ⏳</p>";
    clearInterval(timerInterval); document.getElementById("timerDisplay").style.display = "none";

    try {
        const q = query(collection(db, "Tests"), where("testName", "==", selectedTestName));
        const querySnapshot = await getDocs(q);
        testContainer.innerHTML = ""; correctAnswers = {}; totalMaxMarks = 0; let qIndex = 1;

        querySnapshot.forEach((doc) => {
            const data = doc.data(); const qId = doc.id;
            const qType = data.qType || "MCQ"; const qMarks = data.marks || 1;
            correctAnswers[qId] = { answer: data.answer, question: data.question, marks: qMarks, type: qType }; 
            totalMaxMarks += qMarks; 

            let inputHTML = "";
            if(qType === "MCQ") {
                inputHTML = `
                    <label class="option-label"><input type="radio" name="${qId}" value="A"> ${data.options.A}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="B"> ${data.options.B}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="C"> ${data.options.C}</label>
                    <label class="option-label"><input type="radio" name="${qId}" value="D"> ${data.options.D}</label>
                `;
            } else if (qType === "NUMERICAL") {
                inputHTML = `<input type="number" step="any" id="ans_${qId}" class="numerical-input" placeholder="Type numerical value">`;
            } else if (qType === "SUBJECTIVE") {
                inputHTML = `<textarea id="ans_${qId}" class="subjective-textarea" placeholder="Type your detailed answer here..."></textarea>`;
            }

            testContainer.innerHTML += `
                <div class="question-box">
                    <div class="question-text">Q${qIndex}. ${data.question}</div>
                    <div class="marks-badge">${qMarks} Marks</div>
                    ${inputHTML}
                </div>`;
            qIndex++;
        });
        
        submitTestBtn.innerText = "Submit Test"; submitTestBtn.disabled = false; submitTestBtn.style.display = "block";
        const durationStr = testDurationMap[selectedTestName];
        if (durationStr && parseInt(durationStr) > 0) {
            document.getElementById("timerDisplay").style.display = "block";
            let timeRemaining = parseInt(durationStr) * 60; 
            updateTimerUI(timeRemaining);
            timerInterval = setInterval(() => {
                timeRemaining--; updateTimerUI(timeRemaining);
                if (timeRemaining <= 0) { clearInterval(timerInterval); alert("⏱️ Time is up! Submitting test."); submitTestBtn.click(); }
            }, 1000);
        }
    } catch (error) { testContainer.innerHTML = "<p style='color:red;'>Error loading questions.</p>"; }
}

document.getElementById("backBtn").addEventListener("click", () => { clearInterval(timerInterval); examArea.style.display = "none"; testSelectionArea.style.display = "block"; });

submitTestBtn.addEventListener("click", async () => {
    clearInterval(timerInterval); submitTestBtn.innerText = "Submitting... ⏳"; submitTestBtn.disabled = true;

    let score = 0; let detailedResponses = []; let qIndex = 1;
    let hasSubjective = false; // चेक करने के लिए कि क्या थ्योरी वाला सवाल था

    for (let qId in correctAnswers) {
        const qData = correctAnswers[qId];
        let selectedOption = "Not Attempted"; let isCorrect = false;

        if(qData.type === "SUBJECTIVE") hasSubjective = true;

        if(qData.type === "MCQ") {
            const selectedOptionNode = document.querySelector(`input[name="${qId}"]:checked`);
            if(selectedOptionNode) { selectedOption = selectedOptionNode.value; if(selectedOption === qData.answer) isCorrect = true; }
        } else if (qData.type === "NUMERICAL") {
            const numInput = document.getElementById(`ans_${qId}`);
            if(numInput && numInput.value.trim() !== "") {
                selectedOption = numInput.value.trim();
                if(parseFloat(selectedOption) === parseFloat(qData.answer)) isCorrect = true;
            }
        } else if (qData.type === "SUBJECTIVE") {
            const subjInput = document.getElementById(`ans_${qId}`);
            if(subjInput && subjInput.value.trim() !== "") {
                selectedOption = subjInput.value.trim();
                if(selectedOption.toLowerCase() === qData.answer.trim().toLowerCase()) isCorrect = true;
            }
        }
        
        if (isCorrect) score += qData.marks; 
        detailedResponses.push({ qNum: qIndex, question: qData.question, selected: selectedOption, correct: qData.answer, marks: qData.marks, qType: qData.type, isCorrect: isCorrect });
        qIndex++;
    }

    // अगर सब्जेक्टिव है, तो स्टेटस PENDING रखें, वरना PUBLISHED
    let finalStatus = hasSubjective ? "PENDING" : "PUBLISHED";

    try {
        await addDoc(collection(db, "Results"), {
            studentName: studentNameVal, rollNumber: studentRollVal, testName: currentTestName,
            score: score, totalMarks: totalMaxMarks, date: new Date().toLocaleString(), detailedResponses: detailedResponses,
            status: finalStatus
        });

        testContainer.style.display = "none"; submitTestBtn.style.display = "none"; document.getElementById("timerDisplay").style.display = "none"; 
        
        if(hasSubjective) {
            document.getElementById("resultMessage").innerHTML = `Test Submitted Successfully! 🎉<br><span style="color:orange;">Your answers contain Subjective questions. Score will be displayed after Teacher Review.</span>`;
        } else {
            document.getElementById("resultMessage").innerHTML = `Test Submitted Successfully! 🎉<br>Your Score: ${score} / ${totalMaxMarks} Marks`;
        }
    } catch(error) {
        alert("Error saving your result."); submitTestBtn.innerText = "Submit Test"; submitTestBtn.disabled = false;
    }
});

// नया: स्टूडेंट अपना पुराना रिज़ल्ट देख सकता है
document.getElementById("viewMyResultsBtn").addEventListener("click", async () => {
    const area = document.getElementById("myPastResultsArea");
    area.innerHTML = "<p style='text-align:center;'>Fetching your results...⏳</p>";
    try {
        const q = query(collection(db, "Results"), where("rollNumber", "==", studentRollVal));
        const snaps = await getDocs(q);
        if(snaps.empty) { area.innerHTML = "<p style='color:red;'>No previous results found.</p>"; return; }
        
        let html = "";
        snaps.forEach(doc => {
            const data = doc.data();
            let status = data.status || "PUBLISHED"; 
            if(status === "PENDING") {
                html += `<div class="res-card">
                            <strong>Test: ${data.testName}</strong><br>
                            Date: ${data.date}<br>
                            <span style="color:orange; font-weight:bold;">⏳ Result Pending Teacher Review</span>
                         </div>`;
            } else {
                html += `<div class="res-card" style="border-left-color: green;">
                            <strong>Test: ${data.testName}</strong><br>
                            Date: ${data.date}<br>
                            <span style="color:green; font-weight:bold;">✅ Score: ${data.score} / ${data.totalMarks}</span>
                         </div>`;
            }
        });
        area.innerHTML = html;
    } catch (e) { area.innerHTML = "<p style='color:red;'>Error fetching results.</p>"; }
});
