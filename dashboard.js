import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
// यहाँ हमने doc और updateDoc को जोड़ा है ताकि सवाल Edit हो सकें
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

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

let globalQuestions = {}; // लोड किए गए सवालों को यहाँ सेव करेंगे

// 1. सवाल पब्लिश या अपडेट करने का लॉजिक
publishBtn.addEventListener("click", async () => {
    const testName = document.getElementById("testName").value;
    const questionText = document.getElementById("questionText").value;
    const optA = document.getElementById("optA").value;
    const optB = document.getElementById("optB").value;
    const optC = document.getElementById("optC").value;
    const optD = document.getElementById("optD").value;
    const correctOption = document.getElementById("correctOption").value;
    
    const editId = document.getElementById("editDocId").value; // छुपी हुई ID लाएँ

    if (!testName || !questionText || !optA || !optB || !optC || !optD) {
        statusMessage.innerText = "Please fill all fields! ❌";
        statusMessage.style.color = "red";
        return;
    }

    statusMessage.innerText = "Saving to Database... ⏳";
    statusMessage.style.color = "blue";

    try {
        if (editId !== "") {
            // अगर Edit हो रहा है, तो सवाल को Update करें
            const questionRef = doc(db, "Tests", editId);
            await updateDoc(questionRef, {
                testName: testName,
                question: questionText,
                options: { A: optA, B: optB, C: optC, D: optD },
                answer: correctOption
            });
            statusMessage.innerText = "Question Updated Successfully! ✅";
            document.getElementById("editDocId").value = ""; // ID खाली कर दें
            publishBtn.innerText = "Publish Question to Database"; // बटन का नाम वापस बदलें
        } else {
            // अगर नया सवाल है, तो नया जोड़ें
            await addDoc(collection(db, "Tests"), {
                testName: testName,
                question: questionText,
                options: { A: optA, B: optB, C: optC, D: optD },
                answer: correctOption,
                timestamp: new Date()
            });
            statusMessage.innerText = "Question Published Successfully! ✅";
        }
        
        // फॉर्म खाली करें
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

// 2. डाले हुए सवाल देखने और Edit बटन लगाने का लॉजिक
loadQuestionsBtn.addEventListener("click", async () => {
    questionListArea.innerHTML = "<p style='text-align:center;'>Loading questions... ⏳</p>";
    
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        
        if (querySnapshot.empty) {
            questionListArea.innerHTML = "<p style='text-align:center; color:red;'>No questions found in database.</p>";
            return;
        }

        let html = "";
        globalQuestions = {}; // पुरानी लिस्ट खाली करें

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            globalQuestions[docSnap.id] = data; // सवाल को ग्लोबल लिस्ट में सेव करें

            html += `
                <div class="saved-question">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;"><strong>Test:</strong> ${data.testName}</div>
                    <div style="font-weight: bold; margin-bottom: 8px;">Q: ${data.question}</div>
                    <div style="font-size: 14px; margin-bottom: 5px;"><strong>Correct Answer:</strong> Option ${data.answer}</div>
                    <button class="edit-btn" data-id="${docSnap.id}">✏️ Edit Question</button>
                </div>
            `;
        });
        
        questionListArea.innerHTML = html;

        // 3. Edit बटन पर क्लिक होने पर फॉर्म में डेटा भरना
        const editButtons = document.querySelectorAll(".edit-btn");
        editButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                const docId = e.target.getAttribute("data-id");
                const qData = globalQuestions[docId];

                // फॉर्म के अंदर पुराना डेटा भरें
                document.getElementById("testName").value = qData.testName;
                document.getElementById("questionText").value = qData.question;
                document.getElementById("optA").value = qData.options.A;
                document.getElementById("optB").value = qData.options.B;
                document.getElementById("optC").value = qData.options.C;
                document.getElementById("optD").value = qData.options.D;
                document.getElementById("correctOption").value = qData.answer;

                // छुपे हुए बॉक्स में ID सेट करें और बटन का नाम बदलें
                document.getElementById("editDocId").value = docId;
                document.getElementById("publishBtn").innerText = "Update Changed Question";
                
                // पेज को वापस ऊपर (फॉर्म की तरफ) ले जाएँ
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

    } catch (error) {
        console.error("Error loading questions: ", error);
        questionListArea.innerHTML = "<p style='color:red; text-align:center;'>Error loading questions! ❌</p>";
    }
});
