import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true // Required for browser/extension environment
});

export async function extractWithAI(text) {
  try {
    const prompt = `Extract information from this resume and return it in JSON format. Be precise and include all found information.

Format required:
{
  "name": "Full Name",
  "email": "Email address",
  "phone": "Phone number",
  "education": "Full education details",
  "experience": "Work experience summary",
  "skills": ["Skill 1", "Skill 2", ...],
  "summary": "Professional summary",
  "location": "Location if found",
  "linkedin": "LinkedIn username if found",
  "github": "GitHub username if found",
  "website": "Website if found"
}

Resume text:
${text}

Return only the JSON object, no additional text.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from AI');

    // Parse the JSON response
    const parsed = JSON.parse(response);

    // Clean and validate the parsed data
    return {
      name: parsed.name || text.split('\n')[0] || '', // Fallback to first line for name
      email: parsed.email || text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '',
      phone: parsed.phone || text.match(/[\+\d\s-]{10,}/)?.[0] || '',
      education: parsed.education || '',
      experience: parsed.experience || '',
      skills: Array.isArray(parsed.skills) ? parsed.skills : 
              text.match(/TECHNICAL SKILLS[^\n]*\n([\s\S]*?)(?:\n\n|\Z)/i)?.[1]?.split(',').map(s => s.trim()) || [],
      summary: parsed.summary || '',
      location: parsed.location || text.match(/(?:Location|Address):\s*([^\n]+)/i)?.[1] || '',
      linkedin: parsed.linkedin || text.match(/linkedin\.com\/in\/([^\/\s]+)/i)?.[1] || '',
      github: parsed.github || text.match(/github\.com\/([^\/\s]+)/i)?.[1] || '',
      website: parsed.website || text.match(/https?:\/\/[^\s]+/)?.[0] || ''
    };

  } catch (error) {
    console.error('AI extraction error:', error);
    // Fallback to regex extraction if AI fails
    return {
      name: text.split('\n')[0] || '',
      email: text.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || '',
      phone: text.match(/[\+\d\s-]{10,}/)?.[0] || '',
      education: text.match(/EDUCATION[\s\S]*?(?:\n\n|\Z)/i)?.[0] || '',
      experience: text.match(/EXPERIENCE[\s\S]*?(?:\n\n|\Z)/i)?.[0] || '',
      skills: text.match(/TECHNICAL SKILLS[^\n]*\n([\s\S]*?)(?:\n\n|\Z)/i)?.[1]?.split(',').map(s => s.trim()) || [],
      summary: '',
      location: text.match(/(?:Location|Address):\s*([^\n]+)/i)?.[1] || '',
      linkedin: text.match(/linkedin\.com\/in\/([^\/\s]+)/i)?.[1] || '',
      github: text.match(/github\.com\/([^\/\s]+)/i)?.[1] || '',
      website: text.match(/https?:\/\/[^\s]+/)?.[0] || ''
    };
  }
}

export async function suggestFieldValue(fieldContext, resumeText) {
  try {
    const prompt = `Given this form field label: "${fieldContext}"
And this resume text: "${resumeText}"

What specific value from the resume should be used to fill this field? Return only the value, no explanation.
If no exact match is found, suggest the most appropriate value based on context.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.3,
      max_tokens: 200,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error suggesting value:', error);
    throw new Error('Failed to suggest field value');
  }
} 