// Array to store all questions
let testQuestions = JSON.parse(localStorage.getItem('arkaMedhaQuestions')) || [];

// Function to render dynamic input fields based on question type
function renderQuestionFields() {
    const type = document.getElementById('questionType').value;
    const container = document.getElementById('dynamicFieldsContainer');
    
    container.innerHTML = ''; 

    if (type === 'mcq') {
        container.innerHTML = `
            <div class="form-group">
                <label>Options:</label>
                <input type="text" id="optA" placeholder="Option A">
                <input type="text" id="optB" placeholder="Option B">
                <input type="text" id="optC" placeholder="Option C">
                <input type="text" id="optD" placeholder="Option D">
                <label>Correct Option:</label>
                <select id="correctOption">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                </select>
            </div>
        `;
    } else if (type === 'numerical') {
        container.innerHTML = `
            <div class="form-group">
                <label>Correct Numerical Value:</label>
                <input type="number" step="any" id="numAnswer" placeholder="e.g., 9.8">
            </div>
        `;
    } else if (type === 'subjective') {
        container.innerHTML = `
            <div class="form-group">
                <label>Marking Scheme / Evaluation Keywords:</label>
                <textarea id="subAnswer" rows="2" placeholder="Key points required for full marks..."></textarea>
            </div>
        `;
    }
}

// Function to save the question
function addQuestion() {
    const type = document.getElementById('questionType').value;
    const text = document.getElementById('questionText').value.trim();

    if (text === "") {
        alert("Please enter the question text!");
        return;
    }

    let newQuestion = {
        id: Date.now(),
        type: type,
        question: text,
    };

    // Capture specific data based on type
    if (type === 'mcq') {
        newQuestion.options = {
            A: document.getElementById('optA').value || 'N/A',
            B: document.getElementById('optB').value || 'N/A',
            C: document.getElementById('optC').value || 'N/A',
            D: document.getElementById('optD').value || 'N/A'
        };
        newQuestion.correctAnswer = document.getElementById('correctOption').value;
    } else if (type === 'numerical') {
        newQuestion.correctAnswer = document.getElementById('numAnswer').value;
    } else if (type === 'subjective') {
        newQuestion.markingScheme = document.getElementById('subAnswer').value;
    }

    // Save to array and local storage
    testQuestions.push(newQuestion);
    localStorage.setItem('arkaMedhaQuestions', JSON.stringify(testQuestions));

    // Clear form for next question
    document.getElementById('questionText').value = "";
    renderQuestionFields(); // Reset dynamic fields
    displayQuestions(); // Update screen
}

// Function to display saved questions on the screen
function displayQuestions() {
    const container = document.getElementById('questionsContainer');
    const countSpan = document.getElementById('questionCount');
    
    container.innerHTML = '';
    countSpan.textContent = testQuestions.length;

    testQuestions.forEach((q, index) => {
        let detailsHtml = '';
        
        if (q.type === 'mcq') {
            detailsHtml = `
                <p><strong>A)</strong> ${q.options.A} | <strong>B)</strong> ${q.options.B} | <strong>C)</strong> ${q.options.C} | <strong>D)</strong> ${q.options.D}</p>
                <p style="color: green;"><strong>Answer:</strong> ${q.correctAnswer}</p>
            `;
        } else if (q.type === 'numerical') {
            detailsHtml = `<p style="color: green;"><strong>Answer:</strong> ${q.correctAnswer}</p>`;
        } else if (q.type === 'subjective') {
            detailsHtml = `<p style="color: gray;"><strong>Marking Scheme:</strong> ${q.markingScheme}</p>`;
        }

        container.innerHTML += `
            <div class="question-card">
                <p><span class="badge">${q.type.toUpperCase()}</span> <strong>Q${index + 1}:</strong> ${q.question}</p>
                ${detailsHtml}
            </div>
        `;
    });
}

// Initialize on page load
window.onload = function() {
    renderQuestionFields();
    displayQuestions();
};
