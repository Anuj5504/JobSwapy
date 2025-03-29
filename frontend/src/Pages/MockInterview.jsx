import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaMicrophone, FaStop, FaArrowRight, FaVideo } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

function MockInterview() {
  const navigate = useNavigate();
  const { jobId } = useParams();

  // Core states
  const [jobData, setJobData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [interviewStatus, setInterviewStatus] = useState('initial'); // initial -> ready -> inProgress -> completed
  const [isLoading, setIsLoading] = useState(false);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognition = useRef(null);

  // Add state for camera status
  const [isCameraReady, setIsCameraReady] = useState(false);

  // Add new state for AI speaking
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  // Fetch job data on mount
  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const response = await api.get(`/api/jobs/${jobId}`);
        setJobData(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch job details');
        navigate('/jobs');
      }
    };
    fetchJobData();
  }, [jobId, navigate]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setTranscribedText(transcript);
      };

      recognition.current.onerror = (event) => {
        console.error('Speech recognition error:', event);
        toast.error('Microphone error. Please check your settings.');
        setIsRecording(false);
      };
    } else {
      toast.error('Speech recognition is not supported in your browser');
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Modified prepareInterview function - only fetch questions first
  const prepareInterview = async () => {
    setIsLoading(true);
    try {
      // 1. Generate questions first
      const response = await api.post('/api/interview/generate-questions', { jobData });
      setQuestions(response.data.questions);
      setInterviewStatus('ready');
    } catch (error) {
      console.error('Error preparing interview:', error);
      toast.error('Failed to prepare interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to handle video stream cleanup
  const stopVideoStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  // Modified startCamera function
  const startCamera = async () => {
    try {
      // Stop any existing streams first
      stopVideoStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 1280,
          height: 720,
          facingMode: 'user',
        },
        audio: true
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (error) {
      console.error('Camera setup error:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  // Update the readQuestion function
  const readQuestion = (question) => {
    return new Promise((resolve) => {
      setIsAISpeaking(true);
      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      const utterance = new SpeechSynthesisUtterance(question);

      // Configure voice
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      utterance.lang = 'en-US';

      // Get voices and select a good one
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter(voice =>
        voice.lang.includes('en') &&
        (voice.name.includes('Google') || voice.name.includes('Natural'))
      );

      if (englishVoices.length > 0) {
        utterance.voice = englishVoices[0];
      }

      utterance.onend = () => {
        setIsAISpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  // Update the startInterview function
  const startInterview = async () => {
    if (!isCameraReady) {
      toast.error('Please wait for camera to initialize');
      return;
    }

    setInterviewStatus('inProgress');
    // First read the question
    await readQuestion(questions[0].question);
    // Then start recording
    startRecording();
  };

  // Recording controls
  const startRecording = () => {
    if (recognition.current) {
      setIsRecording(true);
      setTranscribedText('');
      recognition.current.start();
    }
  };

  const stopRecording = async () => {
    if (!transcribedText.trim()) {
      toast.error('No answer detected. Please try again.');
      return;
    }

    if (recognition.current) {
      recognition.current.stop();
    }
    setIsRecording(false);

    try {
      const response = await api.post('/api/interview/analyze-response', {
        question: questions[currentQuestionIndex].question,
        answer: transcribedText,
        jobTitle: jobData.title,
        questionType: questions[currentQuestionIndex].type
      });
      setFeedback(response.data);
    } catch (error) {
      toast.error('Failed to analyze response');
    }
  };

  // Update the nextQuestion function
  const nextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setFeedback(null);
      setTranscribedText('');

      // Read next question first
      await readQuestion(questions[currentQuestionIndex + 1].question);
      // Then start recording
      startRecording();
    } else {
      stopVideoStream();
      setInterviewStatus('completed');
    }
  };

  // Update cleanup effect
  useEffect(() => {
    return () => {
      stopVideoStream();
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  // Add effect to handle camera on status change
  useEffect(() => {
    if (interviewStatus === 'ready' || interviewStatus === 'inProgress') {
      startCamera();
    } else {
      stopVideoStream();
    }
  }, [interviewStatus]);

  // Update the AIAvatar component
  const AIAvatar = ({ isAISpeaking }) => (
    <div className="fixed bottom-8 left-8 z-50">
      <motion.div
        className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-full 
                   shadow-lg p-3 pr-6 border border-blue-100 dark:border-blue-900"
        animate={isAISpeaking ? {
          scale: [1, 1.02, 1],
          transition: { repeat: Infinity, duration: 2 }
        } : {}}
      >
        <div className={`relative rounded-full bg-gradient-to-r from-blue-500 to-blue-600 p-3
                        ${isAISpeaking ? 'ring-4 ring-blue-200 dark:ring-blue-500/30' : ''}`}>
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          {isAISpeaking && (
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-400/30"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.3, 0, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
        <span className={`font-medium ${isAISpeaking ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
          }`}>
          {isAISpeaking ? 'AI Speaking...' : 'AI Assistant'}
        </span>
      </motion.div>
    </div>
  );

  // Update the SpeechVisualizer component
  const SpeechVisualizer = ({ isRecording, transcribedText, isAISpeaking }) => (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 relative overflow-hidden">
      {/* AI Speaking Indicator */}
      {isAISpeaking && (
        <div className="absolute top-0 left-0 right-0 flex justify-center p-2 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </motion.div>
            <span>AI is speaking...</span>
          </div>
        </div>
      )}

      {/* Recording Waves */}
      {isRecording && !isAISpeaking && (
        <div className="absolute top-0 left-0 right-0 flex justify-center p-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-green-500"
                animate={{
                  height: [15, 40, 15],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Transcribed text area */}
      <div className="min-h-[150px] relative mt-8">
        {transcribedText ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed"
          >
            {transcribedText}
          </motion.p>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            {isAISpeaking ? (
              "Please wait while AI reads the question..."
            ) : isRecording ? (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Listening to your answer...
              </motion.div>
            ) : (
              "Waiting for AI to read the question..."
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Initial Setup Screen */}
        {interviewStatus === 'initial' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Mock Interview for {jobData?.title}
            </h1>
            <div className="max-w-2xl mx-auto">
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                We'll conduct a mock interview based on the job requirements.
                Please ensure you're in a quiet environment and your camera and microphone are working.
              </p>
              <button
                onClick={prepareInterview}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg
                         text-lg font-medium transition-all disabled:opacity-50"
              >
                {isLoading ? 'Preparing Questions...' : 'Start Interview'}
              </button>
            </div>
          </div>
        )}

        {/* Ready Screen - Now shows camera initialization */}
        {interviewStatus === 'ready' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Camera Preview</h2>
                <div className="bg-black rounded-lg overflow-hidden relative">
                  {!isCameraReady && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                        <span>Initializing camera...</span>
                      </div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    className={`w-full aspect-video object-cover transition-opacity duration-300 ${isCameraReady && streamRef.current?.active ? 'opacity-100' : 'opacity-0'
                      }`}
                    autoPlay
                    playsInline
                    muted
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Begin</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {isCameraReady
                    ? `Ready to start! You'll have ${questions.length} questions.`
                    : 'Please wait while we initialize your camera...'}
                </p>
                <button
                  onClick={startInterview}
                  disabled={!isCameraReady}
                  className={`${isCameraReady
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-400'
                    } text-white px-8 py-4 rounded-lg text-lg font-medium 
                    transition-all disabled:cursor-not-allowed`}
                >
                  {isCameraReady ? 'Begin Interview' : 'Initializing...'}
                </button>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  // Test the AI voice
                  readQuestion("Hello! I'm your AI interviewer. Let's begin when you're ready.");
                }}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 
                           dark:text-blue-400 dark:hover:text-blue-300"
              >
                <FaMicrophone />
                Test AI Voice
              </button>
            </div>
          </div>
        )}

        {/* Interview In Progress */}
        {interviewStatus === 'inProgress' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Question Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h2>
                  {isRecording && (
                    <span className="flex items-center gap-2 text-red-500">
                      <FaMicrophone className="animate-pulse" />
                      Recording
                    </span>
                  )}
                </div>

                <div className="relative mb-8">
                  <div className={`rounded-lg p-6 ${isAISpeaking
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800'
                      : ''
                    }`}>
                    <p className="text-lg text-gray-800 dark:text-gray-200">
                      {questions[currentQuestionIndex]?.question}
                    </p>
                    {isAISpeaking && (
                      <motion.div
                        className="absolute left-0 top-0 w-1 h-full bg-blue-500"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </div>
                </div>

                {/* Replace the old transcription display with the new visualizer */}
                <SpeechVisualizer
                  isRecording={isRecording}
                  transcribedText={transcribedText}
                  isAISpeaking={isAISpeaking}
                />

                <div className="flex justify-end gap-4">
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-3 bg-red-500 hover:bg-red-600 
                                text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105"
                    >
                      <div className="relative">
                        <FaStop className="z-10 relative" />
                        <motion.div
                          className="absolute inset-0 bg-white rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.2, 0, 0.2],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                      Submit Answer
                    </button>
                  ) : feedback ? (
                    <button
                      onClick={nextQuestion}
                      className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 
                                text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105"
                    >
                      Next Question <FaArrowRight />
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-3 bg-green-500 hover:bg-green-600 
                                text-white px-6 py-3 rounded-lg transition-all transform hover:scale-105"
                    >
                      <div className="relative">
                        <FaMicrophone className="z-10 relative" />
                        <motion.div
                          className="absolute inset-0 bg-white rounded-full"
                          animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.2, 0, 0.2],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                      Start Recording
                    </button>
                  )}
                </div>
              </div>

              {/* Feedback Section */}
              {feedback && <FeedbackCard feedback={feedback} />}
            </div>

            {/* Video Preview */}
            <div className="space-y-4">
              <div className="bg-black rounded-xl overflow-hidden shadow-lg sticky top-6 relative">
                {!isCameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    Loading camera...
                  </div>
                )}
                <video
                  ref={videoRef}
                  className={`w-full aspect-video object-cover ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
                  autoPlay
                  playsInline
                  muted
                />
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                <h3 className="font-medium mb-2">Interview Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Complete */}
        {interviewStatus === 'completed' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Interview Complete!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Thank you for completing the mock interview.
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
            >
              Return to Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackCard({ feedback }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Main Feedback */}
      <div className="border-l-4 border-blue-500 pl-4">
        <p className="text-gray-800 dark:text-gray-200 text-lg">
          {feedback.feedback.mainFeedback}
        </p>
      </div>

      {/* Strengths - Only show if there are any */}
      {feedback.feedback.strengths.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-green-600 dark:text-green-400 font-medium">What You Did Well:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {feedback.feedback.strengths.map((strength, index) => (
              <li key={index} className="text-gray-700 dark:text-gray-300">
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas to Improve */}
      <div className="space-y-2">
        <h4 className="text-amber-600 dark:text-amber-400 font-medium">Areas to Improve:</h4>
        <ul className="list-disc pl-5 space-y-1">
          {feedback.feedback.improvements.map((improvement, index) => (
            <li key={index} className="text-gray-700 dark:text-gray-300">
              {improvement}
            </li>
          ))}
        </ul>
      </div>

      {/* Missing Points */}
      <div className="space-y-2">
        <h4 className="text-gray-700 dark:text-gray-300 font-medium">Key Points to Remember:</h4>
        <ul className="list-disc pl-5 space-y-1">
          {feedback.feedback.missingPoints.map((point, index) => (
            <li key={index} className="text-gray-700 dark:text-gray-300">
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="text-blue-700 dark:text-blue-300 font-medium mb-2">Next Steps:</h4>
        <ul className="space-y-1">
          {feedback.nextSteps.map((step, index) => (
            <li key={index} className="text-blue-600 dark:text-blue-400">
              • {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MockInterview; 