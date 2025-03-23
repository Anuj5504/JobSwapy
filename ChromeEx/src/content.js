// Content script that runs on job application pages
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

async function fillForms(resumeData) {
  try {
    const formFields = getFormFields();
    if (!formFields.length) {
      console.log('No form fields found');
      return false;
    }

    const fieldMappings = formFields.map(field => ({
      element: field,
      label: getEnhancedFieldContext(field),
      type: field.type || field.tagName.toLowerCase()
    })).filter(mapping => mapping.label);

    console.log('Field Mappings:', fieldMappings);

    // Create a more structured prompt
    const prompt = `Form fields to fill:
${JSON.stringify(fieldMappings.map(f => ({
  label: f.label,
  type: f.type
})), null, 2)}

Resume: ${resumeData.text}

Create a JSON object with these exact field labels as keys. Rules:
1. "university prn number" → ""
2. "full name" → Full name from resume
3. "date of birth" → ""
4. "mobile no" → Phone number from resume
5. "10th do not write symbol" → ""
6. "12th do not write symbol" → ""
7. "diploma do not write symbol" → ""
8. "ug aggregate" → ""
9. "personal achievements" → Brief achievements from resume
10. "codechef profile link" → "NA"
11. "hacker rank profile link" → "NA"
12. "technical achievements" → Technical achievements from resume
13. "details about your project" → Project details from resume

Return ONLY a valid JSON object with these exact field labels as keys.
Example format:
{
  "university prn number": "",
  "full name": "Kunal Bodke",
  "date of birth": "",
  "mobile no": "+91-9420262405",
  "10th do not write symbol": "",
  "12th do not write symbol": "",
  "diploma do not write symbol": "",
  "ug aggregate": "",
  "personal achievements": "Winner of coding competition",
  "codechef profile link": "NA",
  "hacker rank profile link": "NA",
  "technical achievements hackathon project competitions etc": "2nd Runner-up in Cavista Technologies India Hackathon",
  "details about your project": "Developed an AI-powered form filling Chrome extension"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 1000
    });

    let response = completion.choices[0].message.content;
    
    // Clean up response and extract JSON
    response = response.replace(/```json\s*|\s*```/g, '');
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON object found in response');
      return false;
    }

    const answers = JSON.parse(jsonMatch[0]);
    console.log('Parsed Answers:', answers);

    // Fill form fields with exact matching
    let filledCount = 0;
    for (const mapping of fieldMappings) {
      // Try exact match first
      let value = answers[mapping.label];
      
      // If no exact match, try normalized match
      if (!value) {
        const normalizedLabel = mapping.label
          .replace(/do not write symbol/g, '')
          .replace(/mention na if not applicable/g, '')
          .replace(/if you have passed.*$/, '')
          .trim();
        value = answers[normalizedLabel];
      }

      if (value) {
        await fillField(mapping.element, value);
        filledCount++;
        console.log('Filled:', mapping.label, '→', value);
      }
    }

    return filledCount > 0;

  } catch (error) {
    console.error('Form filling error:', error);
    return false;
  }
}

// Helper functions
function getDirectTextContent(element) {
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    }
  }
  return text.trim();
}

function getPrecedingText(element) {
  const range = document.createRange();
  range.selectNodeContents(element.parentElement);
  range.setEndBefore(element);
  return range.toString().trim();
}

function getFieldOptions(field) {
  if (field.type === 'radio') {
    const name = field.getAttribute('name');
    return Array.from(document.querySelectorAll(`input[name="${name}"]`))
      .map(radio => radio.value);
  } 
  if (field.tagName === 'SELECT') {
    return Array.from(field.options).map(opt => opt.text);
  }
  return [];
}

function findBestMatch(label, answers) {
  // Direct match
  if (answers[label]) return answers[label];

  // Try matching parts of the label
  const words = label.split(' ');
  for (const [key, value] of Object.entries(answers)) {
    if (words.some(word => key.includes(word))) {
      return value;
    }
  }

  return null;
}

function shouldSkipField(field) {
  // Don't skip radio/checkbox for Google Forms
  return (
    field.type === 'hidden' ||
    field.type === 'submit' ||
    field.type === 'button' ||
    field.type === 'file' ||
    field.style.display === 'none' ||
    !field.offsetParent ||
    field.readOnly ||
    field.disabled ||
    (field.value && field.value.trim() !== '' && field.type !== 'radio' && field.type !== 'checkbox')
  );
}

function getEnhancedFieldContext(field) {
  // For Google Forms, get the question text
  const questionContainer = field.closest('[role="listitem"]') || 
                          field.closest('.freebirdFormviewerComponentsQuestionRoot');
  
  if (questionContainer) {
    const questionText = questionContainer.querySelector('[role="heading"]')?.textContent ||
                        questionContainer.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle')?.textContent ||
                        questionContainer.querySelector('.freebirdFormviewerComponentsQuestionTextTitle')?.textContent;
    
    if (questionText) {
      return questionText.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/required|\*/g, '')
        .trim();
    }
  }

  // Fallback to other identifiers
  const identifiers = [
    field.name,
    field.id,
    field.placeholder,
    field.getAttribute('aria-label'),
    field.getAttribute('data-field'),
    field.title
  ].filter(Boolean);

  return identifiers.join(' ').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getFieldValue(fieldContext, resumeData) {
  // Clean up the field context
  const cleanContext = fieldContext.toLowerCase()
    .replace('your answer', '')
    .replace('must be a number', '')
    .replace('mention na if not applicable', '')
    .trim();

  console.log('Field context:', cleanContext);

  try {
    // Create a more focused prompt that treats the input as a job application question
    const prompt = `Job Application Question: "${cleanContext}"

Candidate's Resume: ${resumeData.text}

Task: Generate a specific answer for this job application question based on the resume.

Rules:
1. Return ONLY the answer that should be filled in the form
2. For standard fields:
   - Name: Return only the full name
   - Contact: Return only phone/email
   - Education: Return only relevant degree/institution
   - Experience: Return only relevant experience
3. For special fields:
   - Profile links: Return "NA"
   - Ratings/Scores: Return "0"
   - Dates/PRN: Return empty string
4. For open-ended questions:
   - Use relevant information from resume
   - Keep answers concise and professional
   - Focus on achievements and skills
5. Do not include any explanations or labels
6. Do not add any formatting or extra text

Return ONLY the answer value.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768", // Using a more capable model for better understanding
      temperature: 0.3,
      max_tokens: 150,
      stop: ["\n", ":", "-", "Answer:", "Response:"] // Prevent extra text
    });

    let value = completion.choices[0].message.content
      .trim()
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/^.*?:\s*/g, '') // Remove label prefixes
      .replace(/^(answer|response|field|value):\s*/i, '') // Remove common prefixes
      .trim();

    // Handle special cases
    if (cleanContext.includes('rating') || cleanContext.includes('score')) {
      value = '0';
    } else if (cleanContext.includes('profile') || cleanContext.includes('link')) {
      value = 'NA';
    } else if (cleanContext.includes('prn') || cleanContext.includes('date') || 
               cleanContext.includes('percentage') || cleanContext.includes('%')) {
      value = '';
    }

    console.log('Generated answer:', value);
    return value;

  } catch (error) {
    console.error('Answer generation error:', error);
    return 'NA';
  }
}

// Add a new function for generating custom answers
async function generateCustomAnswer(jobDescription, question, resumeData) {
  try {
    const prompt = `Job Description: ${jobDescription}
Question: ${question}

Candidate's Resume: ${resumeData.text}

Task: Generate a professional answer for this job application question based on the candidate's resume and the job description.

Rules:
1. Use relevant information from the resume
2. Match skills and experience to job requirements
3. Keep the answer professional and concise
4. Focus on achievements and qualifications
5. Do not include any explanations or formatting

Return ONLY the answer.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.4,
      max_tokens: 300
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Custom answer generation error:', error);
    return 'Unable to generate answer';
  }
}

function getDirectMatch(context, parsedResume) {
  // Standard field patterns with dynamic values from resume
  const patterns = {
    name: {
      match: ['full name', 'name'],
      value: parsedResume.name
    },
    mobile: {
      match: ['mobile no', 'mobile number', 'phone'],
      value: parsedResume.phone
    },
    email: {
      match: ['email', 'e-mail'],
      value: parsedResume.email
    },
    college: {
      match: ['name of the college', 'college name', 'institution'],
      value: parsedResume.education?.college || parsedResume.college
    },
    course: {
      match: ['course', 'degree'],
      value: parsedResume.education?.degree || parsedResume.course
    },
    branch: {
      match: ['branch', 'department', 'stream'],
      value: parsedResume.education?.branch || parsedResume.branch
    },
    year: {
      match: ['year of passing', 'passing year', 'graduation year'],
      value: parsedResume.education?.year || parsedResume.graduationYear
    },
    gender: {
      match: ['gender', 'sex'],
      value: parsedResume.gender || 'NA'
    },
    technical: {
      match: ['technical achievements', 'hackathon'],
      value: parsedResume.achievements?.technical || parsedResume.technicalAchievements || 'NA'
    },
    personal: {
      match: ['personal achievements'],
      value: parsedResume.achievements?.personal || parsedResume.personalAchievements || 'NA'
    },
    project: {
      match: ['project details', 'about your project'],
      value: Array.isArray(parsedResume.projects) ? 
        parsedResume.projects.map(p => `${p.name}: ${p.description}`).join('. ') : 
        parsedResume.projects || 'NA'
    }
  };

  // Clean the context
  context = context.toLowerCase()
    .replace('your answer', '')
    .replace('must be a number', '')
    .replace('mention na if not applicable', '')
    .trim();

  // Check each pattern
  for (const [key, field] of Object.entries(patterns)) {
    if (field.match.some(pattern => context.includes(pattern))) {
      return field.value || 'NA';
    }
  }

  // Empty fields
  if (context.includes('prn') || 
      context.includes('registration') ||
      context.includes('date') ||
      context.includes('dob') ||
      context.includes('birth') ||
      context.includes('percentage') ||
      context.includes('10th') ||
      context.includes('12th') ||
      context.includes('diploma')) {
    return '';
  }

  // Rating fields
  if (context.includes('rating')) {
    return '0';
  }

  // Profile links
  if (context.includes('profile') || 
      context.includes('codechef') || 
      context.includes('hackerrank') || 
      context.includes('github')) {
    return 'NA';
  }

  return null;
}

// Update fillField function to better handle Google Forms
async function fillField(field, value) {
  if (!value && value !== 0) return;

  try {
    // For Google Forms text inputs
    if (field.classList.contains('whsOnd')) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      // Trigger any material design updates
      field.focus();
      field.blur();
    } 
    // For Google Forms textareas
    else if (field.classList.contains('KHxj8b')) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      // Trigger textarea resize if needed
      field.style.height = 'auto';
      field.style.height = field.scrollHeight + 'px';
    }
    // Default handling
    else {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch (error) {
    console.error('Error filling field:', error);
  }
}

// Initialize the sidebar and autofill functionality
const AutofillUI = {
  init: async function() {
    this.addSidebar();
    this.setupMessageListener();
    setupTextSelectionHandler();
    
    // Add the new styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  },

  addSidebar: function() {
    const sidebar = document.createElement('div');
    sidebar.className = 'ai-sidebar';
    
    const dragHandle = document.createElement('div');
    dragHandle.className = 'ai-drag-handle';
    dragHandle.innerHTML = '⋮';
    sidebar.appendChild(dragHandle);

    // Add feature buttons
    [
      { id: 'autofill', icon: '⚡', tooltip: 'AI Autofill' },
      { id: 'profile', icon: '👤', tooltip: 'Profile' },
      { id: 'team', icon: '👥', tooltip: 'Referral' },
      { id: 'progress', icon: '📊', tooltip: 'Resume Match' },
      { id: 'bookmark', icon: '🔖', tooltip: 'Bookmarks' },
      { id: 'custom', icon: '💭', tooltip: 'Custom Answer' }
    ].forEach(feature => {
      const button = this.createFeatureButton(feature);
      sidebar.appendChild(button);
    });

    document.body.appendChild(sidebar);
    this.makeDraggable(sidebar, dragHandle);
  },

  createFeatureButton: function({ id, icon, tooltip }) {
    const button = document.createElement('button');
    button.className = 'ai-feature-btn';
    button.id = `ai-${id}-btn`;
    button.innerHTML = `
      <div class="ai-icon">${icon}</div>
      <div class="ai-tooltip">
        <span class="ai-tooltip-text">${tooltip}</span>
      </div>
    `;

    if (id === 'autofill') {
      button.onclick = () => this.handleAutofill();
    } else if (id === 'profile') {
      button.onclick = () => chrome.runtime.sendMessage({ action: 'openPopup' });
    } else if (id === 'custom') {
      button.addEventListener('click', () => this.handleCustomQuestion());
    }

    return button;
  },

  makeDraggable: function(element, handle) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    handle.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
      handle.style.cursor = 'grabbing';
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, element);
      }
    }

    function dragEnd() {
      isDragging = false;
      handle.style.cursor = 'grab';
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }
  },

  setupMessageListener: function() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'autofill') {
        this.handleAutofill();
      }
    });
  },

  handleAutofill: async function() {
    try {
      const storage = await chrome.storage.local.get(['resumeData']);
      const resumeData = storage.resumeData;
      
      if (!resumeData) {
        this.showMessage('Please upload your resume first', 'error');
        return;
      }

      const button = document.getElementById('ai-autofill-btn');
      if (button) button.classList.add('active');

      const filled = await fillForms(resumeData);
      
      if (filled) {
        this.showMessage('Form filled successfully!', 'success');
      } else {
        this.showMessage('No matching fields found', 'warning');
      }

      if (button) {
        setTimeout(() => button.classList.remove('active'), 1000);
      }
    } catch (error) {
      console.error('Autofill error:', error);
      this.showMessage('Error accessing resume data', 'error');
    }
  },

  handleCustomQuestion: async function() {
    try {
      const { resumeData } = await chrome.storage.local.get(['resumeData']);
      
      if (!resumeData) {
        this.showMessage('Please upload your resume first', 'error');
        return;
      }

      // Get the job description and question from the page or user input
      const jobDescription = document.querySelector('[data-job-description]')?.textContent || '';
      const question = prompt('Enter your application question:');

      if (!question) return;

      const answer = await generateCustomAnswer(jobDescription, question, resumeData);
      
      // You could either:
      // 1. Fill it into a focused input field
      // 2. Copy to clipboard
      // 3. Show in a popup
      navigator.clipboard.writeText(answer);
      this.showMessage('Answer copied to clipboard!', 'success');

    } catch (error) {
      console.error('Custom answer error:', error);
      this.showMessage('Error generating answer', 'error');
    }
  },

  showMessage: function(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `ai-message ${type}`;
    message.textContent = text;
    document.body.appendChild(message);

    setTimeout(() => {
      message.classList.add('fade-out');
      setTimeout(() => message.remove(), 300);
    }, 2000);
  }
};

// Add styles
const styles = document.createElement('style');
styles.textContent = `
  .ai-sidebar {
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    // background: #1E293B;
    padding: 8px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: transform 0.3s;
  }

  .ai-drag-handle {
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: grab;
    margin: -4px 0;
  }

  .ai-drag-handle:active {
    cursor: grabbing;
  }

  .ai-feature-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    transition: all 0.3s;
    color: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    // background: #4F46E5;
  }

  .ai-feature-btn:hover {
    transform: translateX(-5px);
    box-shadow: 4px 4px 10px rgba(0,0,0,0.2);
    background: #4338CA;
  }

  .ai-icon {
    font-size: 20px;
  }

  .ai-tooltip {
    position: absolute;
    right: 52px;
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 13px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .ai-feature-btn:hover .ai-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-5px);
  }

  .ai-message {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
    z-index: 2147483647;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .ai-message.success { background: #10b981; }
  .ai-message.error { background: #ef4444; }
  .ai-message.warning { background: #f59e0b; }

  .fade-out {
    animation: fadeOut 0.3s ease-out forwards;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

document.head.appendChild(styles);

// Initialize the UI
AutofillUI.init(); 

// Add this new function for text selection handling
function setupTextSelectionHandler() {
  document.addEventListener('mouseup', async function(e) {
    const selectedText = window.getSelection().toString().trim();
    if (!selectedText) return;

    try {
      const storage = await chrome.storage.local.get(['resumeData']);
      const resumeData = storage.resumeData;
      
      if (!resumeData) return;

      // Create floating response box
      const responseBox = document.createElement('div');
      responseBox.className = 'ai-response-box';
      responseBox.style.cssText = `
        position: fixed;
        left: ${e.pageX}px;
        top: ${e.pageY + 20}px;
        max-width: 300px;
        padding: 12px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 2147483647;
        font-size: 14px;
        line-height: 1.5;
      `;

      // Add loading state
      responseBox.innerHTML = '<div class="ai-loading">Generating response...</div>';
      document.body.appendChild(responseBox);

      // Get AI response
      const response = await generateContextResponse(selectedText, resumeData);
      responseBox.innerHTML = response;

      // Remove after 5 seconds or on click outside
      setTimeout(() => responseBox.remove(), 5000);
      document.addEventListener('click', function closeResponse(e) {
        if (!responseBox.contains(e.target)) {
          responseBox.remove();
          document.removeEventListener('click', closeResponse);
        }
      });

    } catch (error) {
      console.error('Text selection handler error:', error);
    }
  });
}

// Add this function to generate contextual responses
async function generateContextResponse(selectedText, resumeData) {
  try {
    const prompt = `Selected text: "${selectedText}"
Resume content: ${resumeData.text}

Task: Generate a brief, relevant response based on the selected text and resume.
If the text is:
1. A question: Answer it using resume information
2. A job requirement: Match it with relevant skills/experience
3. A technical term: Show related experience
4. An achievement metric: Compare with resume achievements

Keep response concise and professional. Return ONLY the response.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_tokens: 150
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Response generation error:', error);
    return 'Unable to generate response';
  }
}

// Add these styles to your existing styles
const additionalStyles = `
  .ai-response-box {
    animation: fadeIn 0.2s ease-out;
    transition: all 0.2s ease;
  }

  .ai-loading {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ai-loading:after {
    content: '';
    width: 12px;
    height: 12px;
    border: 2px solid #ddd;
    border-top-color: #666;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Update getFormFields function to better handle Google Forms
function getFormFields() {
  const googleFormSelectors = [
    // Google Forms specific selectors
    '.freebirdFormviewerComponentsQuestionTextRoot',
    '.freebirdFormviewerComponentsQuestionTextTextInput input',
    '.freebirdFormviewerComponentsQuestionRadioRoot input',
    '.freebirdFormviewerComponentsQuestionCheckboxRoot input',
    '.freebirdFormviewerComponentsQuestionSelectRoot select',
    '.freebirdFormviewerComponentsQuestionDateDateInput input',
    '.quantumWizTextinputPaperinputInput',
    '.quantumWizTextinputPapertextareaInput',
    // Backup selectors
    '[role="listitem"] input',
    '[role="listitem"] textarea',
    '[role="radiogroup"] input'
  ];

  const fields = [];
  
  // Try each selector
  googleFormSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (!shouldSkipField(element)) {
        fields.push(element);
      }
    });
  });

  return fields;
} 