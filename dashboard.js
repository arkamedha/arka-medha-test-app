import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

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

// 1. Security Check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("Access Denied! Please login first.");
        window.location.href = "index.html";
    }
});

// 2. Logout Feature
document.getElementById("logoutBtn").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "index.html";
    });
});

const publishBtn = document.getElementById("publishBtn");
const statusMessage = document.getElementById("statusMessage");
const loadQuestionsBtn = document.getElementById("loadQuestionsBtn");
const questionListArea = document.getElementById("questionListArea");
let globalQuestions = {}; 

// 3. Publish & Update Question
publishBtn.addEventListener("click", async () => {
    const testName = document.getElementById("testName").value;
    const questionText = document.getElementById("questionText").value;
    const optA = document.getElementById("optA").value;
    const optB = document.getElementById("optB").value;
    const optC = document.getElementById("optC").value;
    const optD = document.getElementById("optD").value;
    const correctOption = document.getElementById("correctOption").value;
    const editId = document.getElementById("editDocId").value; 

    if (!testName || !questionText || !optA || !optB || !optC || !optD) {
        statusMessage.innerText = "Please fill all fields! ❌";
        statusMessage.style.color = "red";
        return;
    }

    statusMessage.innerText = "Saving... ⏳";
    statusMessage.style.color = "blue";

    try {
        if (editId !== "") {
            const questionRef = doc(db, "Tests", editId);
            await updateDoc(questionRef, {
                testName: testName,
                question: questionText,
                options: { A: optA, B: optB, C: optC, D: optD },
                answer: correctOption
            });
            statusMessage.innerText = "Updated Successfully! ✅";
            document.getElementById("editDocId").value = ""; 
            publishBtn.innerText = "Publish Question"; 
        } else {
            await addDoc(collection(db, "Tests"), {
                testName: testName,
                question: questionText,
                options: { A: optA, B: optB, C: optC, D: optD },
                answer: correctOption,
                timestamp: new Date()
            });
            statusMessage.innerText = "Published Successfully! ✅";
        }
        
        document.getElementById("questionText").value = "";
        document.getElementById("optA").value = "";
        document.getElementById("optB").value = "";
        document.getElementById("optC").value = "";
        document.getElementById("optD").value = "";
        loadQuestionsBtn.click(); 

    } catch (error) {
        statusMessage.innerText = "Error saving! ❌";
        statusMessage.style.color = "red";
    }
});

// 4. Load & View Questions
loadQuestionsBtn.addEventListener("click", async () => {
    questionListArea.innerHTML = "<p style='text-align:center;'>Loading... ⏳</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        if (querySnapshot.empty) {
            questionListArea.innerHTML = "<p style='text-align:center; color:red;'>No questions found.</p>";
            return;
        }

        let html = "";
        globalQuestions = {}; 

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            globalQuestions[docSnap.id] = data; 
            html += `
                <div class="saved-question">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;"><strong>Test:</strong> ${data.testName}</div>
                    <div style="font-weight: bold; margin-bottom: 8px;">Q: ${data.question}</div>
                    <div style="font-size: 14px; margin-bottom: 5px;"><strong>Answer:</strong> Option ${data.answer}</div>
                    <button class="edit-btn" data-id="${docSnap.id}">✏️ Edit</button>
                    <button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button>
                </div>
            `;
        });
        
        questionListArea.innerHTML = html;

        // Edit Button Action
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const docId = e.target.getAttribute("data-id");
                const qData = globalQuestions[docId];
                document.getElementById("testName").value = qData.testName;
                document.getElementById("questionText").value = qData.question;
                document.getElementById("optA").value = qData.options.A;
                document.getElementById("optB").value = qData.options.B;
                document.getElementById("optC").value = qData.options.C;
                document.getElementById("optD").value = qData.options.D;
                document.getElementById("correctOption").value = qData.answer;
                document.getElementById("editDocId").value = docId;
                document.getElementById("publishBtn").innerText = "Update Question";
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        // Delete Button Action
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const docId = e.target.getAttribute("data-id");
                if (confirm("Are you sure you want to delete this?")) {
                    await deleteDoc(doc(db, "Tests", docId));
                    loadQuestionsBtn.click(); 
                }
            });
        });

    } catch (error) {
        questionListArea.innerHTML = "<p style='color:red; text-align:center;'>Error loading! ❌</p>";
    }
});

// 5. Load Student Results
const viewResultsBtn = document.getElementById("viewResultsBtn");
const studentResultsArea = document.getElementById("studentResultsArea");

if(viewResultsBtn) {
    viewResultsBtn.addEventListener("click", async () => {
        studentResultsArea.innerHTML = "<p style='text-align:center;'>Loading Results... ⏳</p>";
        
        try {
            const querySnapshot = await getDocs(collection(db, "Results"));
            
            if (querySnapshot.empty) {
                studentResultsArea.innerHTML = "<p style='text-align:center; color:red;'>No results found yet.</p>";
                return;
            }

            let html = "";
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                html += `
                    <div class="saved-question" style="border-left-color: #28a745;">
                        <div style="font-weight: bold; font-size: 16px;">Student: ${data.studentName} (${data.rollNumber})</div>
                        <div style="color: #666; margin-top: 5px;"><strong>Test:</strong> ${data.testName}</div>
                        <div style="color: green; font-weight: bold; margin-top: 5px; font-size: 18px;">Score: ${data.score} / ${data.totalMarks}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">Time: ${data.date}</div>
                    </div>
                `;
            });
            
            studentResultsArea.innerHTML = html;

        } catch (error) {
            console.error("Error loading results: ", error);
            studentResultsArea.innerHTML = "<p style='color:red; text-align:center;'>Error loading results! ❌</p>";
        }
    });
}
