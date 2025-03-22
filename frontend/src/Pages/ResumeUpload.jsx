import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import api from '../services/api';

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
          

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await api.get('/api/auth/check-registration');
        if (response.data.registrationComplete) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        navigate('/login');
      }
    };
    
    checkRegistrationStatus();
  }, [navigate]);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Basic validation
    if (!selectedFile) return;
    
    if (!selectedFile.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File size exceeds 5MB limit');
      return;
    }
    
    setFile(selectedFile);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.warning('Please select a resume file');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      // Get the token from localStorage
      const token = localStorage.getItem('token');
      
      // Upload resume with progress tracking
      const response = await api.post('/api/auth/upload-resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      // Update user in local storage with skills and interests
      const user = JSON.parse(localStorage.getItem('user'));
      user.skills = response.data.skills;
      user.interests = response.data.interests;
      user.registrationComplete = true;
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Resume uploaded successfully!');
      
      // Redirect to home page after completion
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error uploading resume');
      console.error('Resume upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden p-8"
        >
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
            >
              One Last Step
            </motion.h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Upload your resume to complete registration
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label 
                htmlFor="resume" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Upload Resume (PDF or Word)
              </label>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                onClick={() => document.getElementById('resume').click()}
              >
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <p className="pl-1">
                      {file ? file.name : 'Click to select or drag and drop'}
                    </p>
                    <input
                      id="resume"
                      name="resume"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF or Word up to 5MB
                  </p>
                </div>
              </div>
            </div>
            
            {isUploading && (
              <div className="mt-4">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                        Uploading...
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                    <div
                      style={{ width: `${uploadProgress}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 dark:bg-blue-500"
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isUploading || !file}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
              >
                {isUploading ? 'Uploading...' : 'Complete Registration'}
              </motion.button>
            </div>
            
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
              We'll extract your skills and interests to help you find the perfect job
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default ResumeUpload; 