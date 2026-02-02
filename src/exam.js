"""
ExamGeneratorPro (https://github.com/robomustib/ExamGeneratorPro)
Copyright (c) 2025 Mustafa Bilgin
Licensed under Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
"""

    console.log('Loading script...');

    let questions = [];
    let currentExam = [];
    let taskTemplates = [];
    let currentLogo = null;
    let expectations = new Map();

    class ExpectationStructure {
      constructor(solution = '', criteria = []) {
        this.solution = solution;
        this.criteria = criteria;
      }
      
      getTotalPoints() {
        return this.criteria.reduce((sum, criterion) => sum + criterion.points, 0);
      }
    }

    function showStatus(elementId, message, type) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.className = `status ${type}`;
            console.log('Status:', message);
        }
    }

    function createSampleCSV() {
        console.log('Creating sample CSV...');
        const sampleData = [
            'What is HTML?;5;open;HTML is a markup language for structuring web content.;Correct definition:3;Give example:2',
            'What color is the sky?;3;mc;Blue;Correct answer:3',
            'The [blank] jumps over the [blank].;4;gap;Dog,Fence;First blank correct:2;Second blank correct:2',
            'Name 3 programming languages;6;open;JavaScript, Python, Java;At least 3 languages:4;Correct examples:2',
            'What does CSS mean?;2;mc;Cascading Style Sheets;Correct answer:2',
            'Match pairs: HTML - Markup language;4;memory;HTML=HyperText Markup Language|CSS=Styling|JavaScript=Programming;All pairs correct:4',
            'Connections: Browser - Firefox;3;connection;Browser=Firefox|Browser=Chrome|Browser=Safari;All connections correct:3'
        ].join('\n');
        
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_exam.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showStatus('csvStatus', 'Sample exam CSV created!', 'success');
    }

    function createSampleExpectations() {
        console.log('Creating sample rubric CSV...');
        const sampleData = [
            'What is HTML?;HTML is a markup language for structuring web content.;Correct definition:3;Give example:2',
            'What color is the sky?;Blue;Correct answer:3',
            'The [blank] jumps over the [blank].;Dog,Fence;First blank correct:2;Second blank correct:2',
            'Name 3 programming languages;JavaScript, Python, Java;At least 3 languages:4;Correct examples:2',
            'What does CSS mean?;Cascading Style Sheets;Correct answer:2',
            'Match pairs: HTML - Markup language;HTML=HyperText Markup Language|CSS=Styling|JavaScript=Programming;All pairs correct:4',
            'Connections: Browser - Firefox;Browser=Firefox|Browser=Chrome|Browser=Safari;All connections correct:3'
        ].join('\n');
        
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_rubric.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showStatus('expectationStatus', 'Sample rubric CSV created!', 'success');
    }

    function parseCSV(csvText, isExpectationFile = false) {
        console.log('Parsing CSV...');
        const lines = csvText.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            let cleanLine = line;
            if (cleanLine.startsWith('"') && cleanLine.endsWith('"')) {
                cleanLine = cleanLine.slice(1, -1);
            }
            
            const parts = cleanLine.split(';');
            
            if (isExpectationFile) {
                if (parts.length >= 2) {
                    const question = parts[0].replace(/^"|"$/g, '').trim();
                    let solution = '';
                    const criteria = [];
                    
                    if (parts.length === 2) {
                        solution = parts[1].replace(/^"|"$/g, '').trim();
                    } else {
                        solution = parts[1].replace(/^"|"$/g, '').trim();
                        
                        for (let j = 2; j < parts.length; j++) {
                            const criterionPart = parts[j].split(':');
                            if (criterionPart.length === 2) {
                                const criterionText = criterionPart[0].trim();
                                const criterionPoints = parseInt(criterionPart[1]);
                                if (criterionText && !isNaN(criterionPoints)) {
                                    criteria.push({
                                        text: criterionText,
                                        points: criterionPoints
                                    });
                                }
                            }
                        }
                    }
                    
                    if (question && (solution || criteria.length > 0)) {
                        expectations.set(question, new ExpectationStructure(solution, criteria));
                        console.log('Structured rubric for:', question.substring(0, 30));
                    }
                }
            } else {
                if (parts.length < 2) continue;
                
                const question = parts[0].replace(/^"|"$/g, '').trim();
                const points = parseInt(parts[1]);
                const type = parts[2] ? parts[2].replace(/^"|"$/g, '').trim() : 'open';
                const solution = parts[3] ? parts[3].replace(/^"|"$/g, '').trim() : '';
                const criteria = [];
                
                for (let j = 4; j < parts.length; j++) {
                    const criterionPart = parts[j].split(':');
                    if (criterionPart.length === 2) {
                        const criterionText = criterionPart[0].trim();
                        const criterionPoints = parseInt(criterionPart[1]);
                        if (criterionText && !isNaN(criterionPoints)) {
                            criteria.push({
                                text: criterionText,
                                points: criterionPoints
                            });
                        }
                    }
                }
                
                if (question && !isNaN(points) && points > 0) {
                    const questionObj = { question, points, type };
                    if (solution || criteria.length > 0) {
                        expectations.set(question, new ExpectationStructure(solution, criteria));
                    }
                    questions.push(questionObj);
                    console.log('Question found:', question, 'Type:', type);
                }
            }
        }
        
        if (!isExpectationFile) {
            if (questions.length > 0) {
                showStatus('csvStatus', `Successfully loaded ${questions.length} questions`, 'success');
                document.getElementById('generateExam').disabled = false;
            } else {
                showStatus('csvStatus', 'No valid questions found', 'error');
            }
        } else {
            showStatus('expectationStatus', `Loaded structured rubrics for ${expectations.size} questions`, 'success');
        }
    }

    function loadCSV() {
        console.log('Loading CSV...');
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        
        if (!file) {
            showStatus('csvStatus', 'Please select a file', 'error');
            return;
        }
        
        console.log('File found:', file.name);
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('File read');
            parseCSV(e.target.result);
        };
        
        reader.onerror = function() {
            showStatus('csvStatus', 'Error reading file', 'error');
        };
        
        reader.readAsText(file);
    }

    function loadExpectations() {
        console.log('Loading rubric...');
        const fileInput = document.getElementById('expectationFile');
        const file = fileInput.files[0];
        
        if (!file) {
            showStatus('expectationStatus', 'Please select a file', 'error');
            return;
        }
        
        console.log('Rubric file found:', file.name);
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('Rubric file read');
            parseCSV(e.target.result, true);
        };
        
        reader.onerror = function() {
            showStatus('expectationStatus', 'Error reading file', 'error');
        };
        
        reader.readAsText(file);
    }

    function handleLogoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    currentLogo = {
                        data: e.target.result,
                        width: img.width,
                        height: img.height
                    };
                    document.getElementById('previewLogo').src = currentLogo.data;
                    document.getElementById('previewLogo').style.display = 'block';
                    console.log('Logo uploaded:', img.width + 'x' + img.height);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function useDefaultLogo() {
        currentLogo = {
            data: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiB2aWV3Qm94PSIwIDAgMTIwIDYwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjMzQ5OGRiIiByeD0iNSIvPgo8dGV4dCB4PSI2MCIgeT0iMzUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxPR088L3RleHQ+Cjx0ZXh0IHg9IjYwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW5zdGl0dXQ8L3RleHQ+Cjwvc3ZnPgo=',
            width: 120,
            height: 60
        };
        document.getElementById('previewLogo').src = currentLogo.data;
        document.getElementById('previewLogo').style.display = 'block';
        document.getElementById('logoUpload').value = '';
        console.log('Default logo used');
    }

    function addTaskForm(type) {
        console.log('Adding form for type:', type);
        const formId = 'task-form-' + Date.now();
        const form = document.createElement('div');
        form.className = 'task-form';
        form.id = formId;
        
        let formContent = `
            <h3>${getTaskTypeName(type)} Question</h3>
            <div class="form-group">
                <label for="${formId}-question">Question/Task:</label>
                <textarea id="${formId}-question" rows="3" placeholder="Enter the question here"></textarea>
            </div>
            <div class="form-group">
                <label for="${formId}-points">Points:</label>
                <input type="number" id="${formId}-points" min="1" value="1">
            </div>
            <div class="expectation-builder">
                <h4>Structured Grading Rubric</h4>
                <div class="form-group">
                    <label for="${formId}-solution">Model Solution:</label>
                    <textarea id="${formId}-solution" rows="3" placeholder="Enter the model solution here"></textarea>
                </div>
                <div class="form-group">
                    <label>Assessment Criteria:</label>
                    <div id="${formId}-criteria">
                        <div class="criterion-item">
                            <input type="text" class="criterion-text" placeholder="Criterion 1">
                            <input type="number" class="criterion-points-input" placeholder="Points" min="1" value="1">
                            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
                        </div>
                    </div>
                    <button type="button" class="button button-secondary" onclick="addCriterion('${formId}')">Add Criterion</button>
                </div>
            </div>
        `;
        
        switch(type) {
            case 'mc':
                formContent += `
                    <div class="form-group">
                        <label>Multiple Choice Options:</label>
                        <div id="${formId}-options">
                            <div class="mc-option-input">
                                <input type="text" placeholder="Option 1">
                                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
                            </div>
                            <div class="mc-option-input">
                                <input type="text" placeholder="Option 2">
                                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
                            </div>
                        </div>
                        <button type="button" class="button button-secondary" onclick="addMCOption('${formId}')">Add Option</button>
                    </div>
                    <div class="form-group">
                        <label for="${formId}-correct">Correct Answer (Index, starting at 0):</label>
                        <input type="number" id="${formId}-correct" min="0" value="0">
                    </div>
                `;
                break;
            case 'gap':
                formContent += `
                    <div class="form-group">
                        <label for="${formId}-text">Text with blanks (mark blanks with [blank]):</label>
                        <textarea id="${formId}-text" rows="4" placeholder="Text with [blank] markers"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="${formId}-answers">Answers (comma separated):</label>
                        <input type="text" id="${formId}-answers" placeholder="Answer1, Answer2, Answer3">
                    </div>
                `;
                break;
            case 'memory':
                formContent += `
                    <div class="form-group">
                        <label>Pairs (Term - Definition):</label>
                        <div id="${formId}-pairs">
                            <div class="memory-pair-input">
                                <input type="text" placeholder="Term 1">
                                <input type="text" placeholder="Definition 1">
                                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
                            </div>
                        </div>
                        <button type="button" class="button button-secondary" onclick="addMemoryPair('${formId}')">Add Pair</button>
                    </div>
                `;
                break;
            case 'connection':
                formContent += `
                    <div class="form-group">
                        <label>Connection Pairs (left - right):</label>
                        <div id="${formId}-connections">
                            <div class="connection-pair-input">
                                <input type="text" placeholder="Left Side 1">
                                <input type="text" placeholder="Right Side 1">
                                <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
                            </div>
                        </div>
                        <button type="button" class="button button-secondary" onclick="addConnectionPair('${formId}')">Add Connection</button>
                    </div>
                `;
                break;
        }
        
        formContent += `
            <button type="button" class="button button-success" onclick="saveTask('${formId}', '${type}')">Save Question</button>
            <button type="button" class="button button-secondary" onclick="document.getElementById('${formId}').remove()">Cancel</button>
        `;
        
        form.innerHTML = formContent;
        document.getElementById('taskForms').appendChild(form);
    }

    function addCriterion(formId) {
        const container = document.getElementById(formId + '-criteria');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'criterion-item';
        div.innerHTML = `
            <input type="text" class="criterion-text" placeholder="Criterion ${count}">
            <input type="number" class="criterion-points-input" placeholder="Points" min="1" value="1">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(div);
    }

    function addMCOption(formId) {
        const container = document.getElementById(formId + '-options');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'mc-option-input';
        div.innerHTML = `
            <input type="text" placeholder="Option ${count}">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(div);
    }

    function addMemoryPair(formId) {
        const container = document.getElementById(formId + '-pairs');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'memory-pair-input';
        div.innerHTML = `
            <input type="text" placeholder="Term ${count}">
            <input type="text" placeholder="Definition ${count}">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(div);
    }

    function addConnectionPair(formId) {
        const container = document.getElementById(formId + '-connections');
        const count = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'connection-pair-input';
        div.innerHTML = `
            <input type="text" placeholder="Left Side ${count}">
            <input type="text" placeholder="Right Side ${count}">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(div);
    }

    function saveTask(formId, type) {
        console.log('Saving task:', type);
        const question = document.getElementById(formId + '-question').value;
        const points = parseInt(document.getElementById(formId + '-points').value);
        const solution = document.getElementById(formId + '-solution').value;
        
        if (!question || isNaN(points) || points <= 0) {
            alert('Please fill out all required fields correctly.');
            return;
        }
        
        const criteria = [];
        const criterionInputs = document.querySelectorAll(`#${formId}-criteria .criterion-item`);
        criterionInputs.forEach(criterion => {
            const textInput = criterion.querySelector('.criterion-text');
            const pointsInput = criterion.querySelector('.criterion-points-input');
            if (textInput.value && pointsInput.value) {
                criteria.push({
                    text: textInput.value,
                    points: parseInt(pointsInput.value)
                });
            }
        });
        
        let data = null;
        
        switch(type) {
            case 'mc':
                const options = [];
                const optionInputs = document.querySelectorAll(`#${formId}-options input`);
                optionInputs.forEach(input => {
                    if (input.value.trim()) options.push(input.value.trim());
                });
                if (options.length < 2) {
                    alert('Please enter at least 2 options.');
                    return;
                }
                const correctIndex = parseInt(document.getElementById(formId + '-correct').value);
                data = { options, correct: correctIndex };
                break;
                
            case 'gap':
                const text = document.getElementById(formId + '-text').value;
                const answers = document.getElementById(formId + '-answers').value.split(',').map(a => a.trim());
                if (!text || answers.length === 0) {
                    alert('Please fill out all fields.');
                    return;
                }
                data = { text, answers };
                break;
                
            case 'memory':
                const pairs = [];
                const pairInputs = document.querySelectorAll(`#${formId}-pairs .memory-pair-input`);
                pairInputs.forEach(pair => {
                    const inputs = pair.querySelectorAll('input');
                    if (inputs[0].value && inputs[1].value) {
                        pairs.push({
                            term: inputs[0].value,
                            definition: inputs[1].value
                        });
                    }
                });
                if (pairs.length < 2) {
                    alert('Please enter at least 2 pairs.');
                    return;
                }
                data = { pairs };
                break;
                
            case 'connection':
                const connections = [];
                const connectionInputs = document.querySelectorAll(`#${formId}-connections .connection-pair-input`);
                connectionInputs.forEach(conn => {
                    const inputs = conn.querySelectorAll('input');
                    if (inputs[0].value && inputs[1].value) {
                        connections.push({
                            left: inputs[0].value,
                            right: inputs[1].value
                        });
                    }
                });
                if (connections.length < 2) {
                    alert('Please enter at least 2 connections.');
                    return;
                }
                data = { connections };
                break;
        }
        
        const task = { question, points, type, data };
        taskTemplates.push(task);
        
        if (solution || criteria.length > 0) {
            expectations.set(question, new ExpectationStructure(solution, criteria));
        }
        
        addTaskToList(task, taskTemplates.length - 1);
        document.getElementById(formId).remove();
        
        showStatus('csvStatus', `Question "${question.substring(0, 30)}..." added`, 'success');
        document.getElementById('generateExam').disabled = false;
    }

    function addTaskToList(task, index) {
        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div class="task-info">
                <strong>${getTaskTypeName(task.type)}</strong>: ${task.question.substring(0, 50)}...
                <br><small>Points: ${task.points}</small>
            </div>
            <div class="task-actions">
                <button class="button button-secondary" onclick="editTask(${index})">Edit</button>
                <button class="button remove-btn" onclick="removeTask(${index})">Delete</button>
            </div>
        `;
        document.getElementById('taskList').appendChild(div);
    }

    function getTaskTypeName(type) {
        const names = {
            'open': 'Open Question',
            'mc': 'Multiple Choice',
            'gap': 'Fill in the Blanks',
            'memory': 'Matching Pairs',
            'connection': 'Connection'
        };
        return names[type] || type;
    }

    window.editTask = function(index) {
        alert('Edit function for question ' + (index + 1));
    };

    window.removeTask = function(index) {
        if (confirm('Really delete question?')) {
            const task = taskTemplates[index];
            expectations.delete(task.question);
            taskTemplates.splice(index, 1);
            document.getElementById('taskList').innerHTML = '';
            taskTemplates.forEach((task, i) => addTaskToList(task, i));
            if (taskTemplates.length === 0 && questions.length === 0) {
                document.getElementById('generateExam').disabled = true;
            }
        }
    };

    function generateExam() {
        console.log('Generating exam...');
        const targetPoints = parseInt(document.getElementById('targetPoints').value);
        
        if (isNaN(targetPoints) || targetPoints <= 0) {
            showStatus('generationStatus', 'Invalid point value', 'error');
            return;
        }
        
        const allQuestions = [...questions, ...taskTemplates];
        
        if (allQuestions.length === 0) {
            showStatus('generationStatus', 'No questions available', 'error');
            return;
        }
        
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        const selected = [];
        let total = 0;
        
        for (const question of shuffled) {
            if (total + question.points <= targetPoints) {
                selected.push(question);
                total += question.points;
            }
            if (total >= targetPoints) break;
        }
        
        if (selected.length > 0) {
            currentExam = selected;
            displayExamPreview(selected);
            displayExpectationPreview(selected);
            document.getElementById('examPreview').classList.remove('hidden');
            document.getElementById('expectationPreview').classList.remove('hidden');
            showStatus('generationStatus', `Exam with ${selected.length} questions (${total} points) generated`, 'success');
        } else {
            showStatus('generationStatus', 'No suitable question combination found', 'error');
        }
    }

    function displayExamPreview(exam) {
        console.log('Showing preview...');
        let html = '';
        let totalPoints = 0;
        
        exam.forEach((q, index) => {
            totalPoints += q.points;
            html += `<div class="question task-type-${q.type}">`;
            html += `<div class="points">${q.points} Points</div>`;
            
            let displayQuestion = q.question.replace(/^"|"$/g, '');
            
            if (q.type === 'gap') {
                displayQuestion = displayQuestion.replace(/\[blank\]/g, '_______');
                html += `<div class="question-text">${index + 1}. ${displayQuestion}</div>`;
                html += `<div class="gap-text">${displayQuestion.replace(/_______/g, '<input class="gap-input" placeholder="...">')}</div>`;
            } else {
                html += `<div class="question-text">${index + 1}. ${displayQuestion}</div>`;
            }
            
            if (q.type === 'mc' && q.data) {
                html += '<div class="mc-options">';
                q.data.options.forEach((option, i) => {
                    html += `<div class="mc-option">${String.fromCharCode(65 + i)}) ${option}</div>`;
                });
                html += '</div>';
            } else if (q.type === 'memory' && q.data) {
                html += '<div class="memory-container">';
                const mixedPairs = [...q.data.pairs].sort(() => Math.random() - 0.5);
                mixedPairs.forEach(pair => {
                    html += `<div class="memory-card">${pair.term}</div>`;
                    html += `<div class="memory-card">${pair.definition}</div>`;
                });
                html += '</div>';
            } else if (q.type === 'connection' && q.data) {
                html += '<div class="connection-container">';
                const mixedLeft = [...q.data.connections].map(c => c.left).sort(() => Math.random() - 0.5);
                const mixedRight = [...q.data.connections].map(c => c.right).sort(() => Math.random() - 0.5);
                
                mixedLeft.forEach((left, i) => {
                    html += `<div class="connection-pair">
                        <div class="connection-left">${left}</div>
                        <div class="connection-line"></div>
                        <div class="connection-right">${mixedRight[i]}</div>
                    </div>`;
                });
                html += '</div>';
            }
            
            html += `
                <div class="answer-lines">
                    <div class="answer-line"></div>
                    <div class="answer-line"></div>
                    <div class="answer-line"></div>
                </div>
            `;
            
            html += `
                <div class="evaluation-space">
                    <div class="evaluation-line"><strong>Assessment:</strong> _____ / ${q.points} points</div>
                    <div class="evaluation-line"><strong>Comment:</strong></div>
                    <div class="evaluation-line" style="min-height: 40px; border-bottom: 1px solid #ddd;"></div>
                </div>
            `;
            
            html += '</div>';
        });
        
        document.getElementById('examContent').innerHTML = html;
        document.getElementById('totalPoints').textContent = `Total points: ${totalPoints}`;
        
        document.getElementById('previewTitle').textContent = document.getElementById('examTitle').value;
        document.getElementById('previewSubtitle').textContent = document.getElementById('examSubtitle').value;
    }

    function displayExpectationPreview(exam) {
        console.log('Showing structured rubric...');
        let html = '';
        
        exam.forEach((q, index) => {
            const expectation = expectations.get(q.question);
            
            html += `<div class="expectation-item">`;
            html += `<div class="expectation-question">${index + 1}. ${q.question.replace(/^"|"$/g, '')} (${q.points} points)</div>`;
            
            if (expectation) {
                if (expectation.solution) {
                    html += `<div class="expectation-answer">
                        <strong>Model Solution:</strong> ${expectation.solution}
                    </div>`;
                }
                
                if (expectation.criteria.length > 0) {
                    html += `<div class="expectation-structure">`;
                    html += `<strong>Assessment Criteria:</strong>`;
                    
                    expectation.criteria.forEach((criterion, i) => {
                        html += `<div class="expectation-criteria">
                            <div class="criterion-points">${criterion.points} P</div>
                            ${i + 1}. ${criterion.text}
                        </div>`;
                    });
                    
                    html += `</div>`;
                }
            } else {
                html += `<div class="expectation-answer"><em>No rubric available</em></div>`;
            }
            
            html += `
                <div class="solution-space">
                    <div><strong>Assessment:</strong> _____ / ${q.points} points</div>
                    <div style="margin-top: 8px;"><strong>Comment:</strong></div>
                </div>
            `;
            html += `</div>`;
        });
        
        document.getElementById('expectationContent').innerHTML = html;
    }

    function exportToPDF() {
        console.log('Exporting exam as PDF...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(document.getElementById('examTitle').value, 20, 20);
        doc.setFontSize(12);
        doc.text(document.getElementById('examSubtitle').value, 20, 30);
        
        if (currentLogo) {
            try {
                const maxWidth = 40;
                const maxHeight = 30;
                let logoWidth = currentLogo.width;
                let logoHeight = currentLogo.height;
                
                if (logoWidth > maxWidth || logoHeight > maxHeight) {
                    const ratio = Math.min(maxWidth / logoWidth, maxHeight / logoHeight);
                    logoWidth = logoWidth * ratio;
                    logoHeight = logoHeight * ratio;
                }
                
                const x = 180 - logoWidth;
                const y = 15;
                doc.addImage(currentLogo.data, 'PNG', x, y, logoWidth, logoHeight);
            } catch (e) {
                console.log('Could not insert logo:', e);
            }
        }
        
        const studentName = document.getElementById('studentName').value || '____________________';
        const studentClass = document.getElementById('studentClass').value || '____________________';
        const studentDate = document.getElementById('studentDate').value || '____________________';
        
        let y = 60;
        doc.text(`Name: ${studentName}`, 20, y);
        doc.text(`Class/Course: ${studentClass}`, 20, y + 8);
        doc.text(`Date: ${studentDate}`, 20, y + 16);
        y += 30;
        
        currentExam.forEach((q, index) => {
            let questionText = `${index + 1}. ${q.question.replace(/^"|"$/g, '')} (${q.points} Points)`;
            
            if (q.type === 'gap') {
                questionText = `${index + 1}. ${q.question.replace(/^"|"$/g, '').replace(/\[blank\]/g, '__________')} (${q.points} Points)`;
            }
            
            const splitText = doc.splitTextToSize(questionText, 170);
            
            if (y + splitText.length * 7 > 280) {
                doc.addPage();
                y = 20;
            }
            
            doc.text(splitText, 20, y);
            y += splitText.length * 7 + 5;
            
            if (q.type === 'mc' && q.data) {
                q.data.options.forEach((option, i) => {
                    const optionText = `   ${String.fromCharCode(65 + i)}) ${option}`;
                    const splitOption = doc.splitTextToSize(optionText, 160);
                    
                    if (y + splitOption.length * 7 > 280) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.text(splitOption, 25, y);
                    y += splitOption.length * 7 + 2;
                });
            }
            
            if (y + 30 > 280) {
                doc.addPage();
                y = 20;
            }
            
            doc.text('   ______________________________', 25, y);
            y += 8;
            doc.text('   ______________________________', 25, y);
            y += 8;
            doc.text('   ______________________________', 25, y);
            y += 12;
            
            const evaluationText = `   Assessment: _____ / ${q.points} points`;
            const commentText = `   Comment: ________________________________________________`;
            
            doc.text(evaluationText, 25, y);
            y += 8;
            doc.text(commentText, 25, y);
            y += 15;
            
            y += 5;
        });
        
        doc.save('exam.pdf');
        showStatus('generationStatus', 'Exam PDF created', 'success');
    }

    function exportSolutionPDF() {
        console.log('Exporting structured assessment sheet as PDF...');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text(`Assessment Sheet: ${document.getElementById('examTitle').value}`, 20, 20);
        doc.setFontSize(12);
        doc.text(document.getElementById('examSubtitle').value, 20, 30);
        
        if (currentLogo) {
            try {
                const maxWidth = 40;
                const maxHeight = 30;
                let logoWidth = currentLogo.width;
                let logoHeight = currentLogo.height;
                
                if (logoWidth > maxWidth || logoHeight > maxHeight) {
                    const ratio = Math.min(maxWidth / logoWidth, maxHeight / logoHeight);
                    logoWidth = logoWidth * ratio;
                    logoHeight = logoHeight * ratio;
                }
                
                const x = 180 - logoWidth;
                const y = 15;
                doc.addImage(currentLogo.data, 'PNG', x, y, logoWidth, logoHeight);
            } catch (e) {
                console.log('Could not insert logo:', e);
            }
        }
        
        let y = 50;
        let totalPoints = 0;
        
        currentExam.forEach((q, index) => {
            totalPoints += q.points;
            const expectation = expectations.get(q.question);
            
            let questionText = `${index + 1}. ${q.question.replace(/^"|"$/g, '')} (${q.points} Points)`;
            const splitQuestion = doc.splitTextToSize(questionText, 170);
            
            if (y + splitQuestion.length * 7 > 280) {
                doc.addPage();
                y = 20;
            }
            
            doc.text(splitQuestion, 20, y);
            y += splitQuestion.length * 7 + 2;
            
            if (expectation) {
                if (expectation.solution) {
                    const solutionText = `   Model Solution: ${expectation.solution}`;
                    const splitSolution = doc.splitTextToSize(solutionText, 160);
                    
                    if (y + splitSolution.length * 7 > 280) {
                        doc.addPage();
                        y = 20;
                    }
                    
                    doc.text(splitSolution, 25, y);
                    y += splitSolution.length * 7 + 2;
                }
                
                if (expectation.criteria.length > 0) {
                    const criteriaText = `   Assessment Criteria:`;
                    doc.text(criteriaText, 25, y);
                    y += 7;
                    
                    expectation.criteria.forEach((criterion, i) => {
                        const criterionText = `     ${i + 1}. ${criterion.text} (${criterion.points} P)`;
                        const splitCriterion = doc.splitTextToSize(criterionText, 155);
                        
                        if (y + splitCriterion.length * 7 > 280) {
                            doc.addPage();
                            y = 20;
                        }
                        
                        doc.text(splitCriterion, 30, y);
                        y += splitCriterion.length * 7 + 2;
                    });
                }
            }
            
            const scoreText = `   Points Achieved: _____ / ${q.points}`;
            doc.text(scoreText, 25, y);
            y += 10;
            
            const commentText = `   Comment:`;
            doc.text(commentText, 25, y);
            y += 15;
            
            doc.line(20, y, 190, y);
            y += 20;
        });
        
        doc.setFontSize(14);
        doc.text(`Total Points: _____ / ${totalPoints}`, 20, y);
        
        doc.save('assessment_sheet.pdf');
        showStatus('generationStatus', 'Assessment sheet created', 'success');
    }

    document.getElementById('loadCsv').onclick = loadCSV;
    document.getElementById('createSampleCsv').onclick = createSampleCSV;
    document.getElementById('loadExpectations').onclick = loadExpectations;
    document.getElementById('createSampleExpectations').onclick = createSampleExpectations;
    document.getElementById('addTaskType').onclick = function() {
        const type = document.getElementById('taskType').value;
        addTaskForm(type);
    };
    document.getElementById('generateExam').onclick = generateExam;
    document.getElementById('exportPdf').onclick = exportToPDF;
    document.getElementById('exportSolution').onclick = exportSolutionPDF;
    document.getElementById('logoUpload').onchange = handleLogoUpload;
    document.getElementById('useDefaultLogo').onclick = useDefaultLogo;

    document.getElementById('examTitle').oninput = function() {
        document.getElementById('previewTitle').textContent = this.value;
    };
    
    document.getElementById('examSubtitle').oninput = function() {
        document.getElementById('previewSubtitle').textContent = this.value;
    };

    console.log('Event listeners set - App is ready');
    showStatus('csvStatus', 'Ready - Select a CSV file', 'success');
