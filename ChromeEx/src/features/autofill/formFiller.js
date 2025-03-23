import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

export async function fillForm(resumeData) {
  let filledCount = 0;
  const formElements = document.querySelectorAll('input, textarea, select');
  
  for (const element of formElements) {
    // Skip hidden, submit, button, and file inputs
    if (element.type === 'hidden' || 
        element.type === 'submit' || 
        element.type === 'button' || 
        element.type === 'file' ||
        element.style.display === 'none' ||
        !element.offsetParent) {
      continue;
    }

    // Skip if already filled
    if (element.value && element.value !== '') {
      continue;
    }

    try {
      // First try direct mapping from parsed data
      const directValue = await tryDirectMapping(element, resumeData.parsed);
      
      if (directValue) {
        element.value = directValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
        continue;
      }

      // If no direct mapping, use AI with the stored resume text
      const fieldContext = getFieldContext(element);
      const suggestedValue = await suggestFieldValue(fieldContext, resumeData.text);
      
      if (suggestedValue) {
        element.value = suggestedValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      }
    } catch (error) {
      console.warn('Error filling field:', error);
    }
  }

  return filledCount > 0;
}

function getFieldContext(element) {
  const hints = [
    element.name,
    element.id,
    element.placeholder,
    element.getAttribute('aria-label'),
    element.labels?.[0]?.textContent,
    // Get text from previous sibling or parent
    element.previousElementSibling?.textContent,
    element.parentElement?.textContent
  ].filter(Boolean);

  return hints.join(' ').toLowerCase();
}

async function tryDirectMapping(element, parsedData) {
  const context = getFieldContext(element);
  
  // Common field mappings
  const mappings = {
    'name': ['name', 'full name', 'full_name', 'firstname', 'lastname'],
    'email': ['email', 'e-mail', 'emailaddress'],
    'phone': ['phone', 'telephone', 'mobile', 'cell'],
    'experience': ['experience', 'years of experience', 'work experience'],
    'education': ['education', 'degree', 'qualification'],
    'skills': ['skills', 'technologies', 'programming languages'],
    'summary': ['summary', 'about', 'profile', 'bio', 'description'],
    'location': ['location', 'address', 'city', 'state', 'country'],
    'linkedin': ['linkedin', 'linked-in'],
    'github': ['github', 'git'],
    'website': ['website', 'personal site', 'portfolio']
  };

  for (const [key, patterns] of Object.entries(mappings)) {
    if (patterns.some(pattern => context.includes(pattern))) {
      return parsedData[key];
    }
  }

  return null;
}

async function suggestFieldValue(fieldContext, resumeText) {
  try {
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant that suggests values for job application form fields based on resume content. Return only the value, no explanation."
      },
      {
        role: "user",
        content: `Given this form field context: "${fieldContext}"
        
        And this resume text: "${resumeText}"
        
        What value should be filled in this field? Return only the value, no explanation.`
      }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_completion_tokens: 100,
      top_p: 1,
      stream: false,
      stop: null
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error suggesting value:', error);
    return null;
  }
} 