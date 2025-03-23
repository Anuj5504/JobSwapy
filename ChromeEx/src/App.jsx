import React, { useState, useRef, useEffect } from 'react';
import { parseResume } from './utils/pdfParser';
import { extractInfo } from './utils/aiExtractor';
import AIChatBox from './features/chat/AIChatBox';

function App() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'chat'
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Load saved resume data on component mount
    chrome.storage.local.get(['resumeData'], (result) => {
      if (result.resumeData) {
        setResumeData(result.resumeData);
      }
    });
  }, []);

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const data = await parseResume(file);
      
      // Store both parsed data and full text
      await chrome.storage.local.set({ resumeData: data });
      setResumeData(data);
      setError(null);
    } catch (err) {
      setError('Error processing resume: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[400px] h-[600px] bg-white">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 p-3 ${activeTab === 'upload' ? 'border-b-2 border-blue-500' : ''}`}
        >
          Upload Resume
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 p-3 ${activeTab === 'chat' ? 'border-b-2 border-blue-500' : ''}`}
        >
          AI Chat
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div className="p-4">
          <div className="fixed inset-0 w-[400px] h-[600px] bg-gray-50">
            <div className="h-full overflow-y-auto p-4">
              {/* Header */}
              <div className="bg-indigo-600 rounded-lg px-4 py-3 mb-4">
                <h1 className="text-xl font-bold text-white">AI Apply</h1>
                <p className="text-sm text-indigo-100">Upload your resume and let AI do the work</p>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current.click()}
                    disabled={loading}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-md ${
                      loading 
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <span className="text-lg mr-2">📄</span>
                        Upload Resume (PDF)
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-xs text-gray-500">
                    Upload your resume in PDF format
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
                        </svg>
                      </div>
                      <div className="ml-2">
                        <p className="text-xs text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {resumeData && (
                  <div className="mt-3 bg-green-50 border-l-4 border-green-400 p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      </div>
                      <div className="ml-2">
                        <p className="text-xs text-green-700">
                          Resume processed! Ready to auto-fill applications.
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Name: {resumeData.parsed.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-sm font-medium text-gray-900 mb-3">How it works</h2>
                <ol className="space-y-2">
                  {[
                    'Upload your resume (PDF)',
                    'AI analyzes your details',
                    'Visit job applications',
                    'Click AI Apply button',
                    'Watch it auto-fill'
                  ].map((step, index) => (
                    <li key={index} className="flex items-center text-xs text-gray-600">
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium mr-2">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-[calc(600px-48px)]">
          <AIChatBox />
        </div>
      )}
    </div>
  );
}

export default App;
