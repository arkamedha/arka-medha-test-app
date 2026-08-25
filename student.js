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

let currentTestName = "";
let studentNameVal = "";
let studentRollVal = "";
let correctAnswers = {}; 
let totalQuestions = 0;

// ग्लोबल मैप जो टेस्ट की सिक्यूरिटी याद रखेगा
let testAuthTypeMap = {}; 
let testPinMap = {}; 

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
                if(!testAccessMap[data.testName] && data.allowedRolls) testAccessMap[data.testName] = data.allowedRolls;
                if(!testAuthTypeMap[data.testName] && data.authType) testAuthTypeMap[data.testName] = data.authType;
                if(!testPinMap[data.testName] && data.testPin) testPinMap[data.testName] = data.testPin;
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

// यह फंक्शन चेक करेगा कि टेस्ट खोलने के लिए पासवर्ड चाहिए या OTP
function handleTestClick(testName) {
    currentTestName = testName;
    const authType = testAuthTypeMap[testName] || "none";
    
    testSelectionArea.style.display = "none";
    document.getElementById("securityError").innerText = "";

    if (authType === "none") {
        startTest(testName); // सीधा टेस्ट शुरू
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

// 1. PIN Verify Logic
document.getElementById("verifyPinBtn").addEventListener("click", () => {
    const enteredPin = document.getElementById("enteredPin").value;
    const correctPin = testPinMap[currentTestName];
    
    if(enteredPin === correctPin) {
        securityArea.style.display = "none";
        startTest(currentTestName);
    } else {
        document.getElementById("securityError").innerText = "Incorrect PIN! ❌";
    }
});

// 2. OTP Verify Logic (Phone Auth)
document.getElementById("sendOtpBtn").addEventListener("click", () => {
    const phoneNum = document.getElementById("phoneNum").value;
    if(phoneNum.length < 10) {
        document.getElementById("securityError").innerText = "Enter valid 10-digit number.";
        return;
    }
    document.getElementById("securityError").innerText = "Sending OTP... ⏳";
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
    
    signInWithPhoneNumber(auth, "+91" + phoneNum, window.recaptchaVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            document.getElementById("securityError").innerText = "OTP Sent Successfully! ✅";
            document.getElementById("securityError").style.color = "green";
            document.getElementById("sendOtpBtn").style.display = "none";
            document.getElementById("otpInputDiv").style.display = "block";
        }).catch((error) => {
            document.getElementById("securityError").innerText = "Error sending OTP. Please refresh and try again.";
            console.error(error);
        });
});

document.getElementById("verifyOtpBtn").addEventListener("click", () => {
    const code = document.getElementById("otpCode").value;
    document.getElementById("securityError").innerText = "Verifying... ⏳";
    document.getElementById("securityError").style.color = "blue";

    confirmationResult.confirm(code).then((result) => {
        securityArea.style.display = "none";
        startTest(currentTestName);
    }).catch((error) => {
        document.getElementById("securityError").innerText = "Invalid OTP! ❌";
        document.getElementById("securityError").style.color = "red";
    });
});

document.getElementById("cancelSecurityBtn").addEventListener("click", () => {
    securityArea.style.display = "none";
    testSelectionArea.style.display = "block";
});

// 3. Start Exam (After Security Check)
async function startTest(selectedTestName) {
    examArea.style.display = "block"; 
    document.getElementById("testContainer").style.display = "block"; 
    document.getElementById("resultMessage").innerHTML = ""; 
    document.getElementById("currentTestHeading").innerText = selectedTestName;
    document.getElementById("testContainer").innerHTML = "<p style='text-align:center;'>Loading questions... ⏳</p>";

    try {
        const q = query(collection(db, "Tests"), where("testName", "==", selectedTestName));
        const querySnapshot = await getDocs(q);
        
        document.getElementById("testContainer").innerHTML = "";
        correctAnswers = {};
        totalQuestions = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const qId = doc.id;
            const qNum = totalQuestions + 1;
            
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
            document.getElementById("testContainer").innerHTML += questionHTML;
            totalQuestions++;
        });
        
        document.getElementById("submitTestBtn").innerText = "Submit Test";
        document.getElementById("submitTestBtn").disabled = false;
        document.getElementById("submitTestBtn").style.display = "block";
    } catch (error) {
        document.getElementById("testContainer").innerHTML = "<p style='text-align:center; color:red;'>Error loading questions.</p>";
    }
}

document.getElementById("backBtn").addEventListener("click", () => {
    examArea.style.display = "none";
    testSelectionArea.style.display = "block";
});

document.getElementById("submitTestBtn").addEventListener("click", async () => {
    document.getElementById("submitTestBtn").innerText = "Submitting... ⏳";
    document.getElementById("submitTestBtn").disabled = true;

    let score = 0;
    let detailedResponses = []; 
    let qIndex = 1;

    for (let qId in correctAnswers) {
        const selectedOptionNode = document.querySelector(`input[name="${qId}"]:checked`);
        const selectedOption = selectedOptionNode ? selectedOptionNode.value : "Not Attempted";
        const correctAnswer = correctAnswers[qId].answer;

        if (selectedOption === correctAnswer) score++;

        detailedResponses.push({ qNum: qIndex, question: correctAnswers[qId].question, selected: selectedOption, correct: correctAnswer });
        qIndex++;
    }

    try {
        await addDoc(collection(db, "Results"), {
            studentName: studentNameVal, rollNumber: studentRollVal, testName: currentTestName,
            score: score, totalMarks: totalQuestions, date: new Date().toLocaleString(), detailedResponses: detailedResponses
        });

        document.getElementById("testContainer").style.display = "none";
        document.getElementById("submitTestBtn").style.display = "none";
        document.getElementById("resultMessage").innerHTML = `Test Submitted Successfully! 🎉<br>Your Score: ${score} out of ${totalQuestions}`;
    } catch(error) {
        alert("Error saving your result. Please try again.");
        document.getElementById("submitTestBtn").innerText = "Submit Test";
        document.getElementById("submitTestBtn").disabled = false;
    }
});
