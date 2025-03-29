const express = require('express');
const multer = require('multer');
const { Groq } = require('groq-sdk');

const router = express.Router();
const upload = multer();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const INTERVIEW_SYSTEM_PROMPT = `You are an expert technical interviewer for software engineering positions.
Generate relevant questions and provide detailed feedback based on the candidate's responses.

When generating questions:
1. Mix technical and behavioral questions
2. Focus on skills mentioned in the job description
3. Include scenario-based questions
4. Ensure questions are appropriate for the experience level
5. Include follow-up questions for deeper assessment

When providing feedback:
1. Evaluate technical accuracy
2. Assess problem-solving approach
3. Consider communication clarity
4. Provide specific improvement suggestions
5. Highlight strengths demonstrated`;

// Add this helper function at the top
function cleanJsonResponse(response) {
  // Remove markdown code blocks and any other non-JSON content
  let cleaned = response.replace(/```json\s*|\s*```/g, '');
  cleaned = cleaned.replace(/^\s*[\r\n]/gm, ''); // Remove empty lines
  cleaned = cleaned.trim();
  
  // If response starts with a newline or any other character before {, clean it
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) {
    cleaned = cleaned.substring(firstBrace);
  }
  
  return cleaned;
}

// Generate interview questions
router.post('/generate-questions', async (req, res) => {
  let completion;
  try {
    const { jobData } = req.body;
    
    const prompt = `
    Based on this job:
    Title: ${jobData.title}
    Description: ${jobData.description}
    Required Skills: ${jobData.skills?.join(', ') || ''}
    Experience Level: ${jobData.experience || 'Not specified'}

    Create a JSON object with 5 interview questions in this exact format (no additional text or formatting):
    {
      "questions": [
        {
          "id": 1,
          "question": "What is your experience with [technology]?",
          "type": "technical",
          "expectedTopics": ["relevant skill 1", "relevant skill 2"],
          "followUp": ["Can you describe a project where you used this?"]
        }
      ]
    }

    Make sure to:
    1. Base questions on the job requirements
    2. Include both technical and behavioral questions
    3. Keep JSON format exactly as shown
    4. Return only the JSON object, no other text`;

    completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI that returns only valid JSON objects without any markdown or additional text. Format all responses as clean, parseable JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    let cleanedResponse = completion.choices[0].message.content;
    
    // Log raw response for debugging
    console.log('Raw AI response:', cleanedResponse);

    // Clean the response
    cleanedResponse = cleanJsonResponse(cleanedResponse);
    
    // Log cleaned response
    console.log('Cleaned response:', cleanedResponse);

    // Parse and validate JSON structure
    const parsedResponse = JSON.parse(cleanedResponse);
    
    // Validate expected structure
    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('Invalid response structure');
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('Error generating questions:', error);
    if (completion?.choices?.[0]?.message?.content) {
      console.log('Raw response:', completion.choices[0].message.content);
    }
    res.status(500).json({ 
      error: 'Failed to generate questions',
      details: error.message,
      rawResponse: completion?.choices?.[0]?.message?.content || 'No response available'
    });
  }
});

// Get AI feedback on response
router.post('/analyze-response', async (req, res) => {
  let completion;
  try {
    const { question, answer, jobTitle, questionType } = req.body;
    
    const prompt = `
    You are an expert technical interviewer evaluating a candidate's response.

    Job Position: ${jobTitle}
    Question Type: ${questionType}
    Question: ${question}
    Candidate's Answer: ${answer}

    Provide honest, constructive feedback in this JSON format (no additional text):
    {
      "feedback": {
        "mainFeedback": "Direct and honest feedback about the answer quality",
        "strengths": [
          "Specific strength point (if any)",
          "Another strength (if any)"
        ],
        "improvements": [
          "Specific suggestion for improvement",
          "Another area to work on"
        ],
        "correctPoints": [
          "Technical point that was correct (if any)",
          "Concept that was well explained (if any)"
        ],
        "missingPoints": [
          "Important point that was missed",
          "Key concept that should have been mentioned"
        ]
      },
      "nextSteps": [
        "Specific action item to improve understanding",
        "Resource or topic to study"
      ]
    }

    Be direct and honest. If the answer shows lack of knowledge, say so clearly and provide specific learning suggestions.
    If the answer is "I don't know" or similar, acknowledge that and provide guidance on how to approach learning the topic.
    Do not give artificial scores or praise for incomplete or incorrect answers.`;

    completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an AI that returns only valid JSON objects without any markdown or additional text. Format all responses as clean, parseable JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    let cleanedResponse = completion.choices[0].message.content;
    
    // Log raw response for debugging
    console.log('Raw AI response:', cleanedResponse);

    // Clean the response
    cleanedResponse = cleanJsonResponse(cleanedResponse);
    
    // Log cleaned response
    console.log('Cleaned response:', cleanedResponse);

    // Parse and validate JSON structure
    const parsedResponse = JSON.parse(cleanedResponse);
    
    // Validate expected structure
    if (!parsedResponse.feedback || !parsedResponse.nextSteps) {
      throw new Error('Invalid response structure');
    }

    res.json(parsedResponse);
  } catch (error) {
    console.error('Error analyzing response:', error);
    if (completion?.choices?.[0]?.message?.content) {
      console.log('Raw response:', completion.choices[0].message.content);
    }
    res.status(500).json({ 
      error: 'Failed to analyze response',
      details: error.message,
      rawResponse: completion?.choices?.[0]?.message?.content || 'No response available'
    });
  }
});

// Transcribe audio to text using Whisper API
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    // Here you would integrate with a speech-to-text service
    // For example, using OpenAI's Whisper API:
    /*
    const response = await openai.audio.transcriptions.create({
      file: req.file.buffer,
      model: "whisper-1"
    });
    res.json({ text: response.text });
    */
    
    // For now, return dummy text
    res.json({ text: "This is a placeholder transcription. Integrate with a real speech-to-text service." });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Add this route to handle audio processing
router.post('/process-audio', upload.single('audio'), async (req, res) => {
  try {
    // Here you would process the audio file
    // For now, we'll just use the text directly
    const { text } = req.body;
    
    res.json({ 
      success: true,
      text: text 
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Failed to process audio' });
  }
});

module.exports = router; 