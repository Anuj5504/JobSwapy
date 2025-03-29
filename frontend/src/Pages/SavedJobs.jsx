import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../services/api';

function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        setLoading(true);
        // Get user from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!user || !user.id) {
          setSavedJobs([]);
          return;
        }
        
        const response = await api.get(`/api/users/${user.id}/savedJobs`);
        
        if (response.data && response.data.savedJobs) {
          // Process the jobs to match the expected format
          const processedJobs = response.data.savedJobs.map(job => ({
            id: job._id,
            title: job.title || 'No title',
            company: job.company || 'No company',
            location: job.jobDetails?.location || 'Location not specified',
            description: job.description || 'No description',
            requirements: job.skills || [],
            salary: job.jobDetails?.salary || 'Salary not specified',
            type: job.jobDetails?.employmentType || 'Type not specified',
            postedDate: job.jobDetails?.postedDate || 'Date not specified',
            applyLink: job.applyLink || '#',
            companyDetails: job.companyDetails || {},
            savedDate: job.createdAt || new Date().toISOString()
          }));
          
          setSavedJobs(processedJobs);
        } else {
          setSavedJobs([]);
        }
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        setSavedJobs([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSavedJobs();
  }, []);
  
  const handleUnsaveJob = async (jobId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        return;
      }
      
      // Update UI optimistically
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      
      // Call API to remove job from saved list
      await api.delete(`/api/jobs/unsavejob/${jobId}/${user.id}`);
      
    } catch (error) {
      console.error('Error removing saved job:', error);
      // Refresh the list to restore correct state
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.id) {
        const response = await api.get(`/api/users/${user.id}/savedJobs`);
        if (response.data && response.data.savedJobs) {
          const processedJobs = response.data.savedJobs.map(job => ({
            id: job._id,
            title: job.title || 'No title',
            company: job.company || 'No company',
            location: job.jobDetails?.location || 'Location not specified',
            description: job.description || 'No description',
            requirements: job.skills || [],
            salary: job.jobDetails?.salary || 'Salary not specified',
            type: job.jobDetails?.employmentType || 'Type not specified',
            postedDate: job.jobDetails?.postedDate || 'Date not specified',
            applyLink: job.applyLink || '#',
            companyDetails: job.companyDetails || {},
            savedDate: job.createdAt || new Date().toISOString()
          }));
          setSavedJobs(processedJobs);
        }
      }
    }
  };
  
  // Add handler for Apply button clicks
  const handleApplyClick = async (jobId, applyLink, e) => {
    e.preventDefault(); // Prevent default link behavior
    console.log(`Applying for job ID: ${jobId}`);
    console.log(`Apply link: ${applyLink}`);
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('token'); // Get token as string
      console.log(token);
      
      if (token) {
        // Record the application
        await api.post(`/api/jobs/${jobId}/apply`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      // Open the apply link in a new tab
      window.open(applyLink, '_blank');
    } catch (error) {
      console.error('Error recording job application:', error);
      // Still open the apply link even if tracking fails
      window.open(applyLink, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-3xl flex justify-center items-center" style={{ minHeight: '60vh' }}>
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (savedJobs.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Saved Jobs</h1>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No saved jobs yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Jobs you save will appear here for easy access.</p>
          <Link to="/jobs">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Find Jobs
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Saved Jobs</h1>
      
      <div className="space-y-4">
        {savedJobs.map(job => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1">
              <Link to={`/job/${job.id}`} className="block">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {job.title}
                </h2>
              </Link>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">{job.company} • {job.location}</p>
              <p className="text-green-600 dark:text-green-400 text-sm mb-2">{job.salary}</p>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {job.requirements.slice(0, 3).map((req, i) => (
                  <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                    {req}
                  </span>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Saved on {new Date(job.savedDate || Date.now()).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex sm:flex-col gap-2 justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => handleApplyClick(job.id, job.applyLink, e)}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                Apply
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUnsaveJob(job.id)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
              >
                Remove
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default SavedJobs; 