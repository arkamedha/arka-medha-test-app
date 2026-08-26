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
                        if(res.qType === "SUBJECTIVE" && status === "PENDING") icon = "✍️ (Check Notebook Manually)";
                        
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
                            <span style="font-size:13px;">Check the notebook answers and update total score:</span><br>
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
