// नया: स्टूडेंट अपना पुराना रिज़ल्ट और आंसर-शीट देख सकता है
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
            
            // स्टूडेंट के लिए आंसर-शीट देखने का डिज़ाइन
            let detailsHTML = "";
            if (status === "PUBLISHED" && data.detailedResponses) {
                detailsHTML += `<details style="margin-top: 10px; background: #fff; padding: 10px; border-radius: 5px; cursor: pointer; border: 1px solid #ccc;">
                    <summary style="font-weight: bold; color: #0056b3; outline: none;">👀 View Answer Sheet</summary>
                    <div style="margin-top: 10px; font-size: 14px;">`;
                data.detailedResponses.forEach(res => {
                    let icon = res.isCorrect ? "✅" : (res.selected === "Not Attempted" ? "⚠️" : "❌");
                    let ansPrefix = res.qType === 'MCQ' ? 'Option ' : '';
                    detailsHTML += `<p style="margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
                        <strong>Q${res.qNum}:</strong> ${res.question} <br>
                        Your Answer: <strong>${res.selected}</strong> ${icon} <br>
                        <span style="color: green; font-size: 13px;">Correct Answer: ${ansPrefix}${res.correct}</span>
                    </p>`;
                });
                detailsHTML += `</div></details>`;
            }

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
                            <span style="color:green; font-weight:bold;">✅ Score: ${data.score} / ${data.totalMarks} Marks</span>
                            ${detailsHTML}
                         </div>`;
            }
        });
        area.innerHTML = html;
    } catch (e) { area.innerHTML = "<p style='color:red;'>Error fetching results.</p>"; }
});
