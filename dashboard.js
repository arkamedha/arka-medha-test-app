import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
// यहाँ getDocs जोड़ा गया है ताकि हम डेटाबेस से सवाल वापस पढ़ सकें
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

const publishBtn = document.getElementById("publishBtn");
const statusMessage = document.getElementById("statusMessage");
const loadQuestionsBtn = document.getElementById("loadQuestionsBtn");
const questionListArea = document.getElementById("questionListArea");

// 1. सवाल पब्लिश करने का लॉजिक
publishBtn.addEventListener("click", async () => {
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
        await addDoc(collection(db, "Tests"), {
            testName: testName,
            question: questionText,
            options: { A: optA, B: optB, C: optC, D: optD },
            answer: correctOption,
            timestamp: new Date()
        });

        statusMessage.innerText = "Question Published Successfully! ✅";
        statusMessage.style.color = "green";
        
        // फॉर्म खाली करें (Test Name खाली नहीं कर रहे ताकि उसी टेस्ट के और सवाल जल्दी डाले जा सकें)
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

// 2. डाले हुए सवाल देखने का नया लॉजिक
loadQuestionsBtn.addEventListener("click", async () => {
    questionListArea.innerHTML = "<p style='text-align:center;'>Loading questions... ⏳</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        
        if (querySnapshot.empty) {
            questionListArea.innerHTML = "<p style='text-align:center; color:red;'>No questions found in database.</p>";
            return;
        }

        let html = "";
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            html += `
                <div class="saved-question">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;"><strong>Test:</strong> ${data.testName}</div>
                    <div style="font-weight: bold; margin-bottom: 8px;">Q: ${data.question}</div>
                    <div style="font-size: 14px;"><strong>Correct Answer:</strong> Option ${data.answer}</div>
                </div>
            `;
        });
        
        questionListArea.innerHTML = html;

    } catch (error) {
        console.error("Error loading questions: ", error);
        questionListArea.innerHTML = "<p style='color:red; text-align:center;'>Error loading questions! ❌</p>";
    }
});
