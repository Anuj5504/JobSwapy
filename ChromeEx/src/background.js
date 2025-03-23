import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true // Only for development, use environment variables in production
});

async function handleExtractInfo(resumeText) {
  try {
    const prompt = `
      Analyze this resume and extract the following information in JSON format:
      - Full name
      - Email
      - Phone number
      - Years of experience
      - Education details
      - Skills
      - Professional summary
      
      Resume text:
      ${resumeText}
      
      Return only the JSON object with these fields.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.1,
      max_tokens: 1000
    });

    return { data: JSON.parse(completion.choices[0].message.content) };
  } catch (error) {
    console.error('Error extracting info:', error);
    return { error: error.message };
  }
}

async function handleSuggestFieldValue(fieldContext, resumeText) {
  try {
    const prompt = `
      Given this field from a job application form:
      ${fieldContext}
      
      And this resume:
      ${resumeText}
      
      What would be the most appropriate value to fill in this field?
      Return only the value, no explanation.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 200
    });

    return { data: completion.choices[0].message.content.trim() };
  } catch (error) {
    console.error('Error suggesting field value:', error);
    return { error: error.message };
  }
}

// Background script for handling extension events
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Apply extension installed');
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractInfo') {
    handleExtractInfo(request.resumeText).then(sendResponse);
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'suggestFieldValue') {
    handleSuggestFieldValue(request.fieldContext, request.resumeText).then(sendResponse);
    return true; // Will respond asynchronously
  }

  if (request.action === 'openPopup') {
    chrome.action.openPopup();
  }
}); 