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

// Authentication Check & Logout
onAuthStateChanged(auth, (user) => { if (!user) window.location.href = "index.html"; });
document.getElementById("logoutBtn").addEventListener("click", () => { signOut(auth).then(() => { window.location.href = "index.html"; }); });

// Toggles for PIN and Question Types
document.getElementById("authType").addEventListener("change", (e) => {
    document.getElementById("pinSection").style.display = (e.target.value === "pin") ? "block" : "none";
});

document.getElementById("qType").addEventListener("change", (e) => {
    const val = e.target.value;
    document.getElementById("mcqSection").style.display = (val === "MCQ") ? "block" : "none";
    document.getElementById("numSection").style.display = (val === "NUMERICAL") ? "block" : "none";
    document.getElementById("subjSection").style.display = (val === "SUBJECTIVE") ? "block" : "none";
});

// Create & Edit Questions Logic
const publishBtn = document.getElementById("publishBtn");
const statusMessage = document.getElementById("statusMessage");
const loadQuestionsBtn = document.getElementById("loadQuestionsBtn");
const questionListArea = document.getElementById("questionListArea");
let globalQuestions = {}; 

publishBtn.addEventListener("click", async () => {
    const testName = document.getElementById("testName").value;
    const allowedRolls = document.getElementById("allowedRolls").value; 
    const testDuration = document.getElementById("testDuration").value; 
    const authType = document.getElementById("authType").value; 
    const testPin = document.getElementById("testPin").value; 
    
    const qType = document.getElementById("qType").value;
    const qMarks = document.getElementById("qMarks").value || 1;
    const questionText = document.getElementById("questionText").value;
    
    let optA="", optB="", optC="", optD="", finalAnswer="";

    if (qType === "MCQ") {
        optA = document.getElementById("optA").value; optB = document.getElementById("optB").value;
        optC = document.getElementById("optC").value; optD = document.getElementById("optD").value;
        finalAnswer = document.getElementById("correctOption").value;
        if(!optA || !optB || !optC || !optD) { statusMessage.innerText = "Fill all options for MCQ! ❌"; return; }
    } else if (qType === "NUMERICAL") {
        finalAnswer = document.getElementById("numAnswer").value;
        if(finalAnswer === "") { statusMessage.innerText = "Provide Numerical Answer! ❌"; return; }
    } else if (qType === "SUBJECTIVE") {
        finalAnswer = document.getElementById("subjAnswer").value;
        if(finalAnswer === "") { statusMessage.innerText = "Provide Subjective Answer! ❌"; return; }
    }

    if (!testName || !questionText) { statusMessage.innerText = "Fill Test Name & Question! ❌"; return; }

    statusMessage.innerText = "Saving... ⏳";
    statusMessage.style.color = "blue";

    const questionData = {
        testName, allowedRolls, testDuration, authType, testPin,
        qType, marks: parseFloat(qMarks), question: questionText,
        options: { A: optA, B: optB, C: optC, D: optD },
        answer: finalAnswer, timestamp: new Date()
    };

    const editId = document.getElementById("editDocId").value; 
    try {
        if (editId !== "") {
            await updateDoc(doc(db, "Tests", editId), questionData);
            statusMessage.innerText = "Updated Successfully! ✅";
            document.getElementById("editDocId").value = ""; publishBtn.innerText = "Publish Question"; 
        } else {
            await addDoc(collection(db, "Tests"), questionData);
            statusMessage.innerText = "Published Successfully! ✅";
        }
        
        document.getElementById("questionText").value = "";
        document.getElementById("subjAnswer").value = "";
        document.getElementById("numAnswer").value = "";
        document.getElementById("optA").value = ""; document.getElementById("optB").value = "";
        document.getElementById("optC").value = ""; document.getElementById("optD").value = "";
        loadQuestionsBtn.click(); 
    } catch (error) { statusMessage.innerText = "Error saving! ❌"; statusMessage.style.color = "red"; }
});

// Load Questions Logic
loadQuestionsBtn.addEventListener("click", async () => {
    questionListArea.innerHTML = "<p style='text-align:center;'>Loading... ⏳</p>";
    try {
        const querySnapshot = await getDocs(collection(db, "Tests"));
        if (querySnapshot.empty) { questionListArea.innerHTML = "<p style='text-align:center; color:red;'>No questions found.</p>"; return; }

        let html = "";
        globalQuestions = {}; 

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            globalQuestions[docSnap.id] = data; 
            
            let timeText = data.testDuration ? `| ⏱️ ${data.testDuration} Mins` : "";
            let typeBadge = "🔘 MCQ";
            if(data.qType === "NUMERICAL") typeBadge = "🔢 Numerical";
            else if(data.qType === "SUBJECTIVE") typeBadge = "✍️ Subjective";

            html += `
                <div class="saved-question">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">
                        <strong>Test:</strong> ${data.testName} <span style="color:red;">${timeText}</span>
                    </div>
                    <div style="font-size: 13px; color: #0056b3; margin-bottom: 5px;">
                        [${typeBadge}] [Marks: ${data.marks || 1}]
                    </div>
                    <div style="font-weight: bold; margin-bottom: 8px;">Q: ${data.question}</div>
                    <div style="font-size: 14px; margin-bottom: 5px;"><strong>Answer:</strong> ${data.qType === 'MCQ' ? 'Option ' + data.answer : data.answer}</div>
                    <button class="edit-btn" data-id="${docSnap.id}">✏️ Edit</button>
                    <button class="delete-btn" data-id="${docSnap.id}">🗑️ Delete</button>
                </div>
            `;
        });
        questionListArea.innerHTML = html;

        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const docId = e.target.getAttribute("data-id");
                const qData = globalQuestions[docId];
                
                document.getElementById("testName").value = qData.testName;
                document.getElementById("allowedRolls").value = qData.allowedRolls || ""; 
                document.getElementById("testDuration").value = qData.testDuration || ""; 
                document.getElementById("authType").value = qData.authType || "none";
                document.getElementById("testPin").value = qData.testPin || "";
                document.getElementById("authType").dispatchEvent(new Event('change'));

                document.getElementById("qType").value = qData.qType || "MCQ";
                document.getElementById("qMarks").value = qData.marks || 1;
                document.getElementById("qType").dispatchEvent(new Event('change'));

                document.getElementById("questionText").value = qData.question;
                
                if(qData.qType === "NUMERICAL") { document.getElementById("numAnswer").value = qData.answer; }
                else if(qData.qType === "SUBJECTIVE") { document.getElementById("subjAnswer").value = qData.answer; }
                else {
                    document.getElementById("optA").value = qData.options.A; document.getElementById("optB").value = qData.options.B;
                    document.getElementById("optC").value = qData.options.C; document.getElementById("optD").value = qData.options.D;
                    document.getElementById("correctOption").value = qData.answer;
                }

                document.getElementById("editDocId").value = docId;
                document.getElementById("publishBtn").innerText = "Update Question";
                window.scrollTo({ top: 0, behavior: "smooth" });
            });
        });

        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                if (confirm("Are you sure you want to delete this question?")) {
                    await deleteDoc(doc(db, "Tests", e.target.getAttribute("data-id")));
                    loadQuestionsBtn.click(); 
                }
            });
        });
    } catch (error) { questionListArea.innerHTML = "<p style='color:red; text-align:center;'>Error loading! ❌</p>"; }
});

// View and Manage Student Results Logic
const viewResultsBtn = document.getElementById("viewResultsBtn");
const studentResultsArea = document.getElementById("studentResultsArea");

if(viewResultsBtn) {
    viewResultsBtn.addEventListener("click", async () => {
        studentResultsArea.innerHTML = "<p style='text-align:center;'>Loading Results... ⏳</p>";
        try {
            const querySnapshot = await getDocs(collection(db, "Results"));
            if (querySnapshot.empty) { studentResultsArea.innerHTML = "<p style='text-align:center; color:red;'>No results found yet.</p>"; return; }
            
            let html = "";
            querySnapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const docId = docSnap.id; 
                let status = data.status || "PUBLISHED";

                let detailsHTML = "";
                if(data.detailedResponses && data.detailedResponses.length > 0) {
                    detailsHTML += `<details style="margin-top: 15px; background: #f1f1f1; padding: 10px; border-radius: 5px; cursor: pointer;"><summary style="font-weight: bold; color: #0056b3; outline: none;">👀 View Answer Sheet</summary><div style="margin-top: 10px; font-size: 14px;">`;
                    data.detailedResponses.forEach(res => {
                        let icon = res.isCorrect ? "✅" : (res.selected === "Not Attempted" ? "⚠️" : "❌");
                        if(res.qType === "SUBJECTIVE" && status === "PENDING") icon = "✍️ (Check Manually)";
                        
                        let ansPrefix = res.qType === 'MCQ' ? 'Option ' : '';
                        detailsHTML += `<p style="margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
                            <strong>Q${res.qNum}:</strong> ${res.question} <span style="color:#0056b3;">[${res.marks} Marks]</span><br>
                            Student Answer: <strong>${res.selected}</strong> ${icon} <br>
                            <span style="color: green; font-size: 13px;">Ideal Answer: ${ansPrefix}${res.correct}</span>
                        </p>`;
                    });
                    detailsHTML += `</div></details>`;
                }

                let gradingHTML = "";
                if(status === "PENDING") {
                    gradingHTML = `
                        <div style="margin-top:10px; padding:10px; background:#fff3cd; border:1px solid #ffeeba; border-radius:5px;">
                            <label style="font-size:14px; font-weight:bold; color:#856404;">Teacher Action Required:</label><br>
                            <span style="font-size:13px;">Check the subjective answers above and update total score:</span><br>
                            <input type="number" step="any" id="updateScore_${docId}" value="${data.score}" style="width:70px; padding:5px; margin-top:5px;"> / ${data.totalMarks}
                            <button class="publish-res-btn" data-id="${docId}" style="background:#28a745; color:white; border:none; padding:6px 10px; border-radius:3px; cursor:pointer; margin-left:10px;">✅ Publish Final Result</button>
                        </div>
                    `;
                }

                let statusBadge = status === "PENDING" ? `<span style="background:orange; color:white; padding:2px 5px; border-radius:3px; font-size:12px;">⏳ Needs Checking</span>` : `<span style="background:green; color:white; padding:2px 5px; border-radius:3px; font-size:12px;">✅ Published</span>`;

                html += `
                    <div class="saved-question" style="border-left-color: ${status === 'PENDING' ? 'orange' : '#28a745'}; position: relative;">
                        <div style="font-weight: bold; font-size: 16px;">Student: ${data.studentName} (${data.rollNumber})</div>
                        <div style="color: #666; margin-top: 5px;"><strong>Test:</strong> ${data.testName}</div>
                        <div style="color: green; font-weight: bold; margin-top: 5px; font-size: 18px;">Current Score: ${status === 'PENDING' ? '?' : data.score} / ${data.totalMarks} ${statusBadge}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">Time: ${data.date}</div>
                        ${detailsHTML}
                        ${gradingHTML}
                        <button class="delete-result-btn delete-btn" data-id="${docId}" style="margin-top: 15px;">🗑️ Delete Result</button>
                    </div>
                `;
            });
            studentResultsArea.innerHTML = html;

            document.querySelectorAll(".publish-res-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    const docId = e.target.getAttribute("data-id");
                    const newScore = document.getElementById(`updateScore_${docId}`).value;
                    if(confirm(`Are you sure you want to publish the final score as ${newScore}?`)) {
                        try {
                            await updateDoc(doc(db, "Results", docId), { score: parseFloat(newScore), status: "PUBLISHED" });
                            alert("Result Published Successfully! Student can now see their score.");
                            viewResultsBtn.click(); 
                        } catch(err) { alert("Error publishing result."); }
                    }
                });
            });

            document.querySelectorAll(".delete-result-btn").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    if (confirm("Delete this student's result?")) {
                        await deleteDoc(doc(db, "Results", e.target.getAttribute("data-id")));
                        viewResultsBtn.click(); 
                    }
                });
            });
        } catch (error) { studentResultsArea.innerHTML = "<p style='color:red; text-align:center;'>Error loading results! ❌</p>"; }
    });
}
